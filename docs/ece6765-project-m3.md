Milestone 3: System Sensitivity Study
==========================================================================

Milestone 2 optimized your application. This milestone leaves the
application code largely alone and asks the central question of the project:
**given a fixed program, how sensitive is its performance to the system
underneath it?**

This is the part of the project closest to the course material. Every knob
here -- NUMA placement, page size, core allocation, PCIe affinity, clock
frequency, vector unit availability, contention from a co-runner -- is a
datacenter architecture decision that someone makes for real, at scale, with
real consequences. You get to measure what those decisions are worth on a
workload you understand.

The deliverable is not a faster pipeline. It is a defensible account of
which system properties this workload cares about, which it does not, and
why -- and the "does not" half carries as much credit as the other.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m3.md` plus code in your `team-XX` repo
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - Systematic sweeps across at least **three** of the five configuration
   families in Section 2 -- including scalability and microarchitectural
   interference -- with results tied back to the component characterizations
   from M2.
 - A **core allocation study**: how performance scales with cores per
   service, and where the optimal split lies for your pipeline.
 - An explanation of each significant effect in architectural terms, backed
   by counter data where relevant.
 - A **sensitivity summary**: for each knob you swept, how much it moved
   performance, which component it acted on, and the mechanism behind it.
 - A **best-known configuration**, reproducible from a committed config
   file, and what it delivers over M2.

2. What to Do
--------------------------------------------------------------------------

Sweep at least **three** of the five families below, and the three must
include **scalability (2.3)** and **microarchitectural interference (2.4)**.
For each, hold everything else fixed and change one variable at a time.

!!! note "The knobs listed are a starting point"

    Each family below names knobs worth investigating; none of the lists is
    exhaustive, and some entries may turn out not to exist or not to matter
    on this platform. Finding a configuration dimension that is not listed
    here and showing it matters is worth more than exhaustively sweeping the
    ones that are.


### 2.1. Memory configuration

 - **NUMA placement.** Which node each service's memory is allocated on,
   whether its threads run on the same node, and what a deliberately remote
   placement costs. The vector index and generation weights are both
   substantial working sets worth investigating.
 - **Page size.** Huge pages versus base pages, for the vector index and for
   model weights. Tie the result back to the TLB miss data from M2: if a
   service was TLB-bound, this is where you find out how much that cost.
 - **Far memory / tiered memory.** _Configuration available on the course
   servers: TBD._ Where placing cold data on slower, more distant memory is
   acceptable, and where it destroys tail latency.

### 2.2. Network and I/O configuration

 - **CPU placement relative to devices.** PCIe affinity: whether the cores
   handling I/O sit on the same node as the device they are talking to.
 - **Service colocation.** Which services share a node, and what the
   inter-service hop costs as a function of that placement.
 - **Interrupt and queue affinity**, where the platform exposes it.

### 2.3. Scalability

The core allocation study is **required** -- do this family regardless of
which others you pick.

You have a fixed number of cores and several components competing for them.
Sweep the allocation: how does each component scale in isolation as you give
it more cores, where does each stop scaling, and what split of the total
maximizes end-to-end throughput?

Expect the answer to be interesting. Services that scale well in isolation
often do not once they are competing for shared cache and memory bandwidth,
and the best end-to-end split is rarely the one predicted by the individual
scaling curves. Report both, and explain the gap.

### 2.4. Microarchitectural interference

The "dedicated server" you have been measuring on is a convenient fiction.
In a real datacenter your workload shares last-level cache, memory
bandwidth, and interconnect with whatever else the scheduler put on that
machine -- and in your own pipeline, the components already contend with
each other.

This family is **required**. It is the one that most directly tests whether
you understand what your components are bound by.

 - **Self-interference.** Your own components already compete. Which pairs
   hurt each other when colocated on the same cores, the same LLC slice, or
   the same memory controller? Isolate them and measure the difference.
 - **Induced interference.** Run a co-runner alongside your pipeline -- a
   cache-thrashing loop, a bandwidth hog, a spin loop -- and measure the
   damage as a function of what it contends for. A component you concluded
   was compute-bound in M2 should barely notice a bandwidth hog. Check
   whether that prediction holds.
 - **Contention-aware placement.** Given what you find, is there a placement
   that isolates your most sensitive component from the rest? What does that
   isolation cost in throughput?
 - **Tail latency under interference.** Interference usually shows up in the
   tail long before it shows up in the mean. Report distributions.

!!! tip "This is the noisy-neighbor problem"

    You are reproducing, at small scale, the effect that drives a great deal
    of real datacenter provisioning policy: why operators leave capacity on
    the floor, why some workloads are marked non-colocatable, and why
    isolation mechanisms exist in hardware at all. A clean measurement of how
    much a co-runner costs your p99 is one of the most transferable results
    you can produce in this project.

### 2.5. Processor configuration

 - **Clock frequency.** Sweep it and measure performance and, where the
   platform allows, energy. A service that is memory-bound will barely
   respond to frequency -- which makes this a clean test of your M2
   characterizations. Frequency sweeps are the cheapest way in this project
   to connect back to the energy proportionality material from Topic 4.
 - **Vector units.** Enable and disable SIMD execution for the embedding and
   generation services and measure the difference. This is a direct test of
   the vectorization claims you made in M2.

3. Methodology requirements
--------------------------------------------------------------------------

This milestone generates a lot of configurations, and the most common
failure is a pile of numbers with no controlled comparison behind them.

!!! danger "Automate your sweeps"

    Hand-running configurations and pasting numbers into a spreadsheet does
    not survive contact with this milestone. Write a sweep script that takes
    a config, launches the pipeline, runs the harness, and appends a row to
    a results file. Commit it. You will re-run everything at least once when
    you discover a mistake, and again in M4.

 - **One variable at a time.** Every reported effect must come from a
   comparison where only that variable changed.
 - **Run-to-run variance.** System-level effects are often small relative to
   measurement noise. If you cannot distinguish a 3% effect from noise,
   collect more data or report it as indistinguishable -- do not report it
   as a 3% improvement.
 - **Record the whole configuration.** Every result needs the full machine
   state it was taken under. A number without its configuration is not
   reproducible.
 - **Re-check correctness.** Some of these knobs can affect numerics.

4. What to Submit
--------------------------------------------------------------------------

Commit your sweep infrastructure, configs, and a file named `m3.md` at the
repo root containing:

 - [ ] **Title and group members**
 - [ ] **Experimental setup** -- machine state, what was held fixed,
       observed variation, and how you handled noise
 - [ ] **Per-family results** (~1 page each, three-plus families) -- sweep
       figures with an explanation of each significant effect in
       architectural terms
 - [ ] **Core allocation study** (~1-1.5 pages) -- per-service scaling
       curves, the end-to-end allocation sweep, the optimum you found, and
       why it differs from what the individual curves predict
 - [ ] **Connection to M2** -- where the M2 characterizations predicted these
       results, and where they did not
 - [ ] **Best-known configuration** -- the winning config, committed as a
       file in `config/`, with its improvement over M2 in both throughput and
       the latency distribution
 - [ ] **Null and negative results** -- knobs that did not matter, and why
       that is itself informative
 - [ ] **Correctness confirmation**
 - [ ] **Status and blockers**

```bash
git add m3.md img/ results/ config/ scripts/
git commit -m "Milestone 3 submission"
git push
```

5. Grading Rubric
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Breadth | _TBD_ | Three-plus families swept, including scalability and interference |
| Interference study | _TBD_ | Contention effects measured and predicted correctly from the M2 characterization |
| Experimental control | _TBD_ | One variable at a time; machine state recorded; noise handled honestly |
| Core allocation study | _TBD_ | Isolated and end-to-end scaling both measured; the gap explained |
| Architectural explanation | _TBD_ | Effects explained by mechanism, not just reported as numbers |
| Connection to M2 | _TBD_ | Results checked against the earlier characterizations, including where they failed |
| Reproducibility | _TBD_ | Automated sweeps and committed configs; staff can reproduce the best config |
| Writeup | _TBD_ | Readable sweep figures, correct units, honest null results |

6. Tips
--------------------------------------------------------------------------

!!! tip "Null results are the point here"

    "Huge pages did nothing for the embedding service, because its working
    set fits in the TLB reach already, as shown by the M2 counter data" is a
    complete and excellent result. Half of what this milestone teaches is
    which knobs matter for which bottlenecks -- and that means finding the
    ones that do not.

!!! tip "Start the sweeps early"

    A full sweep across several families with adequate measurements takes
    real wall-clock time on one server. Groups that start the week before
    the deadline often cannot characterize noise and lose most of the
    methodology credit.

!!! tip "The best configuration is the M4 starting point"

    Whatever you find here is what you carry into M4. Make sure it is
    captured in a config file that reproduces it exactly, not in somebody's
    shell history.

!!! tip "Predict before you measure"

    Write down what you expect each sweep to do before running it, based on
    your M2 characterization. Being wrong is informative and makes for a
    much better report than reporting results you never had an expectation
    about.
