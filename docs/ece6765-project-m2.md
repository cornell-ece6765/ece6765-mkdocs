Milestone 2: Profiling and Application-Level Optimization
==========================================================================

In Milestone 1 you built a correct, naive pipeline and guessed at its
bottleneck. In this milestone you find out whether you were right, using
hardware performance counters, and then you fix what you find -- staying
entirely above the operating system. Everything here is a change to *your
application*: how it batches, how it parallelizes, how its services talk to
each other, and what algorithms it uses.

System-level knobs -- NUMA, page size, core pinning, frequency -- are
[Milestone 3](ece6765-project-m3.md). Leave them at their defaults here, and
record what those defaults are.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/index.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m2.md` plus code in your `project-gNN` repo
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A performance-counter profile of each component of your pipeline, and a
   characterization of what each one is actually limited by.
 - A confirmed or refuted M1 bottleneck hypothesis, with the evidence.
 - At least **three** application-level optimizations implemented and
   measured independently, drawn from different categories in Section 2.3.
 - A quantified account of the throughput/tail-latency tradeoff your
   batching strategy makes.
 - A cumulative speedup over the M1 baseline, with an attribution of how
   much came from where.

2. What to Do
--------------------------------------------------------------------------

!!! note "The optimization categories are a map, not a checklist"

    Sections 2.1-2.5 name the *kinds* of work this milestone expects and the
    minimum breadth required. They are not a list of optimizations to
    implement in order. Which specific changes you make within each category,
    and whether you find something better that is not listed at all, is the
    substance of the milestone. Unlisted approaches you can justify and
    measure are welcome and score well.


### 2.1. Profile with performance counters

Collect hardware counter data for each service under load. At minimum,
characterize each service on:

 - **Instruction throughput** -- IPC, and whether the service is
   front-end-bound, back-end-bound, or retiring well
 - **Memory behavior** -- cache miss rates at each level, memory bandwidth
   consumed, TLB miss rates
 - **Vectorization** -- what fraction of work is going through SIMD units in
   the embedding and generation services
 - **Stall attribution** -- where cycles are actually going

Tooling and the counter set available on the Ampere servers are covered in
the [Server and Measurement Guide](ece6765-server-guide.md).

The output of this step is not a wall of counter dumps. It is a claim per
service: *this service is bound by X, and here is the counter evidence.*

### 2.2. Test your M1 hypothesis

State your M1 bottleneck hypothesis, then say whether the profile confirms
it. If it was wrong, say so plainly and explain what misled you -- a
correctly diagnosed wrong hypothesis is worth full credit here, and it is a
more interesting result than being right by luck.

### 2.3. Optimize

Implement and measure **at least three** optimizations, from at least
**two** of the following categories. Each must be measured independently
against the M1 baseline, one change at a time.

#### Batching

The reference implementation runs batch size 1 end to end. Constructing
batches at service interfaces is usually the single largest available win,
particularly at the embedding service where the model is small and
per-invocation overhead dominates.

Things to work out: where batches are formed, how long you are willing to
wait to fill one, whether batch size should differ per service, and what it
does to TTFT. **Report the tradeoff curve, not just your chosen point.**

#### Communication stack

The `embedding → vectordb` path serializes full dense vectors as JSON. This
is the obvious candidate. Options include gRPC with protobuf, a binary
framing over raw sockets, Unix domain sockets or shared memory for
colocated services, or simply a more efficient encoding over the existing
HTTP transport.

Measure the cost you are removing before you remove it: how many bytes, how
much CPU in serialization versus deserialization versus transport.

#### Parallelism and concurrency

How many requests are in flight, how work is distributed across threads
within a service, where queues form and how deep they get. Look for
serialization points -- a global lock, a single-threaded event loop, a
connection pool that is too small.

#### Algorithms

Approximate versus exact nearest-neighbor search and its parameters, the
value of `k`, index structure, quantization of stored vectors, prompt
construction and context length in the generation service.

!!! danger "Algorithmic changes can break correctness"

    Approximate search, aggressive quantization, and reduced `k` all trade
    answer quality for speed. Re-run harness correctness mode after each
    one. An optimization that drops you below the quality threshold is not
    an optimization, and in the contest it scores zero.

### 2.4. Attribute the speedup

Report cumulative speedup over M1 and decompose it: how much came from each
optimization. If the pieces do not sum to the whole -- and they usually do
not, because removing one bottleneck exposes another -- explain the
interaction. That explanation is worth more than the speedup itself.

### 2.5. Re-profile

Profile again after optimizing. The bottleneck has almost certainly moved.
Say where it went and what that implies for [Milestone
3](ece6765-project-m3.md).

3. What to Submit
--------------------------------------------------------------------------

Commit your optimized code and a file named `m2.md` at the repo root
containing:

 - [ ] **Title and group members**
 - [ ] **Profiling methodology** -- tools, counters, how you collected under
       load, how many runs
 - [ ] **Per-service characterization** (~1 page) -- what each service is
       bound by, with counter evidence
 - [ ] **Hypothesis outcome** (~2 paragraphs) -- confirmed or refuted, and why
 - [ ] **Optimizations** (~2-3 pages) -- for each: what you changed, why you
       expected it to help, the measured effect in isolation, and whether
       the counters explain the result
 - [ ] **Batching tradeoff figure** -- throughput versus TTFT/tail across
       batch sizes
 - [ ] **Cumulative results** -- speedup over M1 across all three metric
       families, with attribution
 - [ ] **Post-optimization profile** -- where the bottleneck moved
 - [ ] **Correctness confirmation** -- harness quality score after all
       changes
 - [ ] **Negative results** -- what you tried that did not help, and your
       diagnosis of why
 - [ ] **Status and blockers**

```bash
% git add m2.md img/ results/ src/ scripts/
% git commit -m "Milestone 2 submission"
% git push
```

4. Grading Rubric
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Profiling rigor | _TBD_ | Counters collected correctly under load; conclusions follow from data |
| Characterization quality | _TBD_ | A defensible, specific claim about what limits each service |
| Optimization breadth | _TBD_ | Three-plus optimizations across two-plus categories, measured in isolation |
| Explanation | _TBD_ | Results attributed to architectural causes, not just reported |
| Batching analysis | _TBD_ | The throughput/latency tradeoff is quantified, not asserted |
| Correctness maintained | _TBD_ | Still clears the quality threshold |
| Writeup | _TBD_ | Clear figures, honest negative results, claims matching evidence |

5. Tips
--------------------------------------------------------------------------

!!! tip "One change at a time"

    The most common way to lose points here is a writeup reporting a 3x
    speedup from four simultaneous changes, with no way to tell which
    mattered. Measure each in isolation against the baseline, then measure
    them together.

!!! tip "Profile under realistic load"

    Counters collected while the pipeline serves a single query tell you
    almost nothing about behavior when the harness dumps a thousand queries
    in at once. Profile the loaded system.

!!! tip "Negative results are graded, and graded well"

    An optimization you expected to help, that did not, with counter data
    explaining why, is one of the strongest things you can put in this
    report. Do not hide the things that failed.

!!! tip "Keep the baseline runnable"

    Tag or branch your M1 baseline so you can re-run it on demand. You will
    want to re-measure it on the same machine state as your optimized
    version, and remembering a number from three weeks ago is not a
    comparison.
