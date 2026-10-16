Milestone 3: System Sensitivity Study
==========================================================================

Milestone 2 optimized your application. This milestone holds the
application fixed and asks the central question of the project: **given a
fixed program, how sensitive is its performance to the system underneath
it?**

Every knob here -- core allocation, NUMA placement, page size, contention
from a co-runner, clock frequency and the policy that sets it -- is a
datacenter architecture decision that someone makes for real, at scale,
with real consequences. You get to measure what those decisions are worth
on a workload you have already profiled.

The deliverable is not a faster pipeline. It is a defensible account of
which system properties this workload cares about, which it does not, and
why -- and the "does not" half carries as much credit as the other.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m3.md` plus code in your `team-XX` repo

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A controlled environment -- fixed clock frequency and a known machine
   state -- with its remaining run-to-run variation measured.
 - Controlled sweeps of all four configuration families: core
   allocation, memory placement and page size, interference, and clock
   frequency and energy.
 - An explanation of each significant effect in architectural terms,
   backed by measurement, and checked against the characterization you
   built in M2.
 - A **sensitivity summary**: for each knob you swept, how much it moved
   performance, which component it acted on, and the mechanism behind it.
 - A **best-known configuration**, reproducible from a committed
   configuration file, and what it delivers over your M3 starting point.

2. Your Starting Point
--------------------------------------------------------------------------

Your M3 baseline is **your own M2 final configuration**: the combined
configuration you reported in `m2.md`. Groups start from different places,
and that is expected; every comparison in this milestone is against your
own baseline.

 - Tag the commit of that configuration `m3-baseline` and push the tag.
 - List every setting in it that differs from the released starter or the
   server's defaults: backend and precision, corpus variant, index, replica
   and thread counts, and any placement, page-size, or frequency setting
   you already applied in M2.
 - If you had to change the M2 configuration to make it run reproducibly,
   say what you changed and why.
 - Re-measure the baseline on all four public traces in the controlled
   environment of [Section 3.1](#31-establish-a-controlled-environment),
   following the methodology in
   [Section 4](#4-methodology-requirements). Your M2 numbers
   were taken under different machine conditions and are not a valid
   reference for M3 comparisons.

Application logic is not the subject of this milestone. If you change
application code -- for example, to make a knob controllable -- measure
that change separately and say so. Inter-service communication (wire
format, transport, framing) stays as it is in your baseline; it opens as a
design axis in Milestone 4.

3. What to Do
--------------------------------------------------------------------------

Performance on these servers is not determined by your configuration
alone. Clock-frequency changes, interference from other processes, SSD
garbage collection, and other background activity can perturb any one
run. Before you can see what a design decision is worth, you need an
environment in which that decision is the only thing that changes. Build
that environment first (3.1), then sweep all four configuration families
(3.2 through 3.5). For each family, hold everything else fixed and change
one variable at a time.

!!! note "The knobs listed are a starting point"

    Each family names knobs worth investigating; none of the lists is
    exhaustive, and some entries may turn out not to exist or not to matter
    on this platform. Finding a configuration dimension that is not listed
    and showing it matters is worth more than exhaustively sweeping the
    ones that are.

### 3.1. Establish a controlled environment

 - **Fix the clock frequency.** Set every core to one fixed frequency and
   keep it there for every experiment in Sections 3.2 through 3.4. Choose
   a frequency the cores can sustain under full load, report it, and
   verify from measurement that the cores actually run at it. Frequency
   itself is the subject of Section 3.5, and only there.
 - **Control the rest of the machine state.** Establish the starting
   state described in [Section 4](#4-methodology-requirements) before
   every run, and keep anything that is not part of your experiment off
   the server while you measure.
 - **Measure your noise floor.** Run your baseline several times in this
   environment and report the run-to-run variation that remains. That
   variation is the smallest effect any later sweep can claim. If it is
   large, find out why and reduce it before you start sweeping.

### 3.2. Core allocation and scalability

You have a fixed number of cores and four services, some of them
replicated, competing for them.

 - **Isolated scaling.** How does each service scale as you give it more
   cores, measured on its own? Where does each one stop scaling, and what
   stops it?
 - **End-to-end allocation.** Sweep the division of cores among services,
   replicas, and threads per replica. Which split maximizes end-to-end
   throughput, and what does it do to the completion-latency
   distribution?
 - **Oversubscription.** What happens when the threads you start exceed
   the cores they can run on, and where in the pipeline does that cost
   show up?
 - **Service placement.** Which services share a socket with which, and
   what that placement costs or saves.

Expect the answer to be interesting. Services that scale well in isolation
often do not once they compete for shared cache, memory bandwidth, and
cores, and the best end-to-end split is rarely the one the individual
scaling curves predict. Report both, and explain the gap.

### 3.3. Memory placement and page size

Your M2 block diagram measured what local and remote memory cost on this
machine. This family finds out what that costs your pipeline.

 - **NUMA placement.** Which node each service's memory is allocated on,
   whether its threads run on the same node, and what interleaved and
   deliberately remote placements cost. The generation weights and the
   vector index are the working sets most worth investigating.
 - **Verify placement.** Requesting a placement policy does not guarantee
   where pages land. Measure where each service's memory actually resides,
   and report it with every result in this family.
 - **Automatic page migration.** Whether the kernel moves pages between
   nodes while your pipeline runs, and what that does to placement,
   performance, and run-to-run variation.
 - **Page size.** Base pages versus huge pages, for the model weights and
   the vector index. Tie the result back to your M2 counter data: if a
   phase showed address-translation overhead, this is where you find out
   what it cost.
 - **Remote memory as a slower tier.** Treat the other socket's memory as
   a slower, more distant tier: where placing part of a working set there
   is acceptable, and where it damages tail latency.

### 3.4. Microarchitectural interference

The "dedicated server" you have been measuring on is a convenient fiction.
In a real datacenter your workload shares last-level cache, memory
bandwidth, and interconnect with whatever else the scheduler put on that
machine -- and in your own pipeline, the components already contend with
each other.

This family is the one that most directly tests whether you understand
what your components are bound by.

 - **Self-interference.** Your own components and replicas already
   compete. Which pairs hurt each other when they share cores, a socket,
   or a memory controller? Isolate them and measure the difference. If
   your replicas slow each other down while measured memory traffic is
   well below the bandwidth you measured in M2, explain why.
 - **Induced interference.** Run a co-runner alongside your pipeline --
   for example a cache-thrashing loop, a bandwidth hog, or a spin loop --
   and measure the damage as a function of what it contends for and how
   hard. A component you concluded was compute-bound in M2 should barely
   notice a bandwidth hog. Check whether that prediction holds.
 - **Contention-aware placement.** Given what you find, is there a
   placement that isolates your most sensitive component from the rest?
   What does that isolation cost in throughput? Find out which hardware
   isolation mechanisms this platform offers, if any.
 - **Tail latency under interference.** Interference usually shows up in
   the tail long before it shows up in the mean. Report distributions.

!!! tip "This is the noisy-neighbor problem"

    You are reproducing, at small scale, the effect that drives a great
    deal of real datacenter provisioning policy: why operators leave
    capacity on the floor, why some workloads are marked non-colocatable,
    and why isolation mechanisms exist in hardware at all. A clean
    measurement of how much a co-runner costs your p99 is one of the most
    transferable results you can produce in this project.

### 3.5. Clock frequency and energy

Every other family ran at one fixed frequency. This family lifts that
restriction and measures what frequency, and the policy that sets it, is
worth to your workload.

 - **Fixed-frequency sweep.** Sweep the core clock across the range the
   platform supports and measure throughput and the latency distribution.
   A phase that is memory-bound will barely respond to frequency, which
   makes this a clean test of your M2 characterizations.
 - **Frequency governors.** Compare dynamic voltage and frequency
   scaling (DVFS) under the on-demand governor, which raises the clock
   with load, against the performance governor, which holds the highest
   frequency, and against the server's default policy. Report the
   frequencies your cores actually ran at under each, and what each costs
   or saves in throughput, tail latency, and energy relative to your
   fixed-frequency results.
 - **Uncore frequency.** If the platform lets you change the frequency of
   the uncore -- the interconnect, shared cache, and memory controllers
   -- measure its effect separately from the core clock. If it does not,
   say how you established that.
 - **Power and energy.** Where the platform exposes power measurements,
   report power and energy per query across the sweep, and say where they
   come from and what they cover.

This family connects directly to the energy proportionality and power
capping material from Topic 4: what would capping this server's power
cost your workload, and which component would pay?

4. Methodology requirements
--------------------------------------------------------------------------

This milestone generates many configurations, and the most common failure
is a pile of numbers with no controlled comparison behind them. These
requirements apply to every experiment, starting with the controlled
environment in [Section 3.1](#31-establish-a-controlled-environment). A
single run is not sufficient: run every experiment several times and
report statistically significant results with bounded error. A knob's
effect is only real if it exceeds that error.

!!! danger "Automate your sweeps"

    Hand-running configurations and pasting numbers into a spreadsheet
    does not survive contact with this milestone. Write a sweep script
    that takes a configuration, applies the machine state, launches the
    pipeline, runs the harness, and records the result together with the
    state it was taken under. Commit it. You will re-run everything at
    least once when you discover a mistake, and again in M4.

 - **One variable at a time.** Every reported effect must come from a
   comparison where only that variable changed.
 - **Start from a known state.** Page cache contents, free memory per node,
   and leftover processes all change where your pipeline's memory lands
   and how fast it runs. Define the machine state each run starts from,
   establish it before every launch, and say how.
 - **Run-to-run variation.** Repeat each configuration you draw a
   conclusion from, report the mean with an error bound, and compare
   configurations measured in the same session. If you cannot distinguish
   a 3% effect from noise, report it as indistinguishable -- not as a 3%
   improvement.
 - **Record the whole configuration.** Every result needs the full machine
   state it was taken under, as listed in the [Server and Measurement
   Guide](ece6765-server-guide.md#43-record-the-machine-state), plus
   where each service's memory actually resided and the frequencies its
   cores ran at. Verify the state was applied; do not trust that a script
   applied it.
 - **Traces.** You may run a sweep on a single trace. Your M3 baseline and
   your best-known configuration must each be measured on **all four**
   public traces.
 - **Re-check functional correctness.** Check functional correctness at
   every step to make sure the application logic stays the same in every
   run.

### 4.1. Changing machine state

Your group has sudo on its server, and many knobs in this milestone need
it. With that comes responsibility for a machine your teammates share:

 - Apply every machine-state change through a committed script, never by
   hand, so the state behind each result is reproducible.
 - Restore the server's default state when you finish a session, and
   record what the defaults are.
 - Do not change the boot configuration, the kernel, or account and sudo
   settings. If a knob you want needs one of these, ask staff first.
 - Settings applied at runtime are lost when the server reboots. Your
   scripts, not your memory, are what reapply them.

5. What to Submit
--------------------------------------------------------------------------

Commit your sweep infrastructure, configurations, and results, push the
`m3-baseline` tag, and add a file named `m3.md` at the repository root
containing:

 - [ ] **Title and group members**
 - [ ] **Starting point** -- the `m3-baseline` commit, the list of
       non-default settings, and the re-measured baseline on all four
       traces
 - [ ] **Experimental setup** -- the fixed frequency you chose and how
       you verified it, the machine state each run starts from, what was
       held fixed, how state was applied and verified, the noise floor you
       measured, and how you handled it
 - [ ] **Per-family results** -- for each of the four families, figures
       with an explanation of each significant effect in architectural
       terms, including where each service's memory resided
 - [ ] **Core allocation study** -- isolated scaling curves, the
       end-to-end allocation sweep, the optimum you found, and why it
       differs from what the isolated curves predict
 - [ ] **Sensitivity summary** -- a table with one row per knob: the range
       swept, the effect on throughput and on tail latency relative to
       measured variation, the component it acted on, and the mechanism
 - [ ] **Connection to M2** -- where the M2 characterizations predicted
       these results, and where they did not
 - [ ] **Best-known configuration** -- committed as a configuration file
       in your repository, with its improvement over your M3 baseline in
       throughput, the latency distribution, and answer quality on all
       four traces
 - [ ] **Null and negative results** -- knobs that did not matter, and why
       that is itself informative
 - [ ] **How to run it** -- exact commands that apply the machine state,
       launch the baseline and the best-known configuration, run the
       harness, and restore the defaults
 - [ ] **Status and blockers**

Follow the [Report Guidelines](ece6765-report-guidelines.md).

```bash
git add m3.md img/ results/ scripts/ <your config directory>
git commit -m "Milestone 3 submission"
git push
git push origin m3-baseline
```

The submission is the last commit on `main` at or before the deadline.

Feedback will be pushed to your group repository as
`m3-feedback-<DATE>.md` after the deadline.
