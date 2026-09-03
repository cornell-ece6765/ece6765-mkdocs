Milestone 2: Profiling and Application-Level Optimization
==========================================================================

In Milestone 1 you instrumented the supplied baseline and identified its
likely bottleneck. In this milestone you find out whether you were right, using
hardware performance counters, and then you fix what you find -- staying
entirely above the operating system. Everything here is a change to *your
application*: how it batches, how it parallelizes, how its services talk to
each other, and what algorithms it uses.

System-level knobs -- NUMA, page size, core pinning, frequency -- are
[Milestone 3](ece6765-project-m3.md). Keep them fixed here, and record their
values.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m2.md` plus code in your `team-XX` repo
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A performance-counter profile of each component of your pipeline, and a
   characterization of what each one is actually limited by.
 - A confirmed or refuted M1 bottleneck hypothesis, with the evidence.
 - At least **three** application-level optimizations implemented and
   measured independently, drawn from different categories in Section 2.3,
   **including at least one scheduling change and at least one change to the
   communication stack between services**.
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
**two** of the following categories. Two of them are required: at least one
**scheduling change**, and at least one change to the **communication stack**
between services. Each must be measured independently against the M1
baseline, one change at a time.

#### Scheduling

Scheduling policy can affect resource utilization and the latency
distribution without changing service code. Explore whether request cost is
predictable and how to keep each service useful rather than letting the
pipeline drain between requests.

This is the cheapest large win available in this milestone and the one most
directly connected to the course material. Groups routinely find that a
scheduling change moves p50 more than every micro-optimization they made
combined.

!!! note "Scheduling and throughput are not the same problem"

    If a scheduling change moves throughput, explain how it changed
    utilization before claiming the result in your writeup.

#### Batching

Batching at service interfaces can amortize invocation and communication
overhead, particularly at the embedding service. Measure how a batching
strategy affects both throughput and latency rather than reporting only the
configuration you chose.

#### Communication stack (required)

This is the axis the project is built around, and the [four-service
decomposition](ece6765-project-arch.md#11-the-decomposition-is-fixed) is fixed
precisely so that it stays measurable. You cannot make a hop cheaper by
deleting it, so make it cheaper on its own terms.

What M1 leaves you is **plain HTTP with JSON bodies** --
the [reference protocol](ece6765-project-arch.md#3-internal-interfaces-the-semesters-experiment).
Only the *semantics* of each hop are fixed. The wire format, the transport,
the framing, who initiates, and whether the call blocks are all yours to
change. The axes, roughly in the order groups tend to find them:

 - **Serialization.** JSON arrays of floats are an expensive way for the
   frontend to exchange embedding vectors. Binary encodings,
   protobuf/FlatBuffers, or a raw length-prefixed float buffer.
 - **Transport.** gRPC, raw TCP sockets, Unix domain sockets, shared memory
   rings for colocated services. Each has a different cost structure and a
   different failure mode.
 - **Concurrency and call structure.** Synchronous request/response versus
   pipelined or asynchronous calls; whether generation can begin before
   retrieval fully completes.
 - **Connection management.** The reference clients reuse HTTP connections.
   Pool sizing, keep-alive policy, and their effects remain open to study.
 - **Data movement.** Whether passages are copied through the frontend at all
   or passed by reference, and who owns the buffer.

Batching is the sixth axis and usually the largest of them, but it is big
enough to have its own category above.

Measure the cost you are removing before you remove it: how many bytes, how
much CPU in serialization versus deserialization versus transport. A protocol
change that you cannot account for in those terms is a guess that happened to
work.

These axes interact, and so do the categories in this section. A binary
format that reduces serialization cost may change the value of batching; a
shared-memory ring may make copies free but pin two services to the same
NUMA node, which [Milestone 3](ece6765-project-m3.md) will make you care
about.

Keep the old implementation selectable. You will want to re-run against it in
M3 and M4, and a protocol you can switch at launch time is worth far more
than one you replaced in place.

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
    answer quality for speed. Re-run the harness after each one. An
    optimization that drops you below the quality threshold is not an
    optimization, and a pipeline below the threshold produces performance
    numbers that mean nothing.

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
       load, and observed variation
 - [ ] **Per-service characterization** (~1 page) -- what each service is
       bound by, with counter evidence
 - [ ] **Hypothesis outcome** (~2 paragraphs) -- confirmed or refuted, and why
 - [ ] **Optimizations** (~2-3 pages) -- for each: what you changed, why you
       expected it to help, the measured effect in isolation, and whether
       the counters explain the result
 - [ ] **Batching tradeoff figure** -- throughput versus tail latency across
       batching strategies
 - [ ] **Cumulative results** -- improvement over M1 in both throughput and
       the latency distribution, with attribution
 - [ ] **Post-optimization profile** -- where the bottleneck moved
 - [ ] **Correctness confirmation** -- harness quality score after all
       changes
 - [ ] **Negative results** -- what you tried that did not help, and your
       diagnosis of why
 - [ ] **Status and blockers**

```bash
git add m2.md img/ results/ src/ scripts/
git commit -m "Milestone 2 submission"
git push
```

4. Grading Rubric
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Profiling rigor | _TBD_ | Counters collected correctly under load; conclusions follow from data |
| Characterization quality | _TBD_ | A defensible, specific claim about what limits each service |
| Optimization breadth | _TBD_ | Three-plus optimizations across two-plus categories, including the two required ones, measured in isolation |
| Communication stack | _TBD_ | Protocol change justified by measured serialization/transport cost, not assumed |
| Explanation | _TBD_ | Results attributed to architectural causes, not just reported |
| Batching analysis | _TBD_ | The throughput/latency tradeoff is quantified, not asserted |
| Scheduling analysis | _TBD_ | Effect of scheduling policy on utilization and latency measured and explained |
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

    Counters collected while the pipeline is idle tell you almost nothing
    about behavior under the full workload. Profile the loaded system.

!!! tip "Negative results are graded, and graded well"

    An optimization you expected to help, that did not, with counter data
    explaining why, is one of the strongest things you can put in this
    report. Do not hide the things that failed.

!!! tip "Keep the baseline runnable"

    Tag or branch your M1 baseline so you can re-run it on demand. You will
    want to re-measure it on the same machine state as your optimized
    version, and remembering a number from three weeks ago is not a
    comparison.
