Milestone 4: Synthesis and Final Report
==========================================================================

The last milestone asks you to pull a semester of measurements into a single
coherent account: what you built, what you learned about how this workload
responds to the machine underneath it, and why it behaves the way it does.

The final report is the deliverable that matters most in this project. It is
where the sensitivity studies from M2 and M3 stop being a pile of sweeps and
become an argument.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/index.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for all
deadlines.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m4.md` plus a tagged final commit
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A final configuration of your pipeline, reproducible from a tagged commit
   and a committed config file, with its performance characterized.
 - A final report covering the semester's work, centered on what you learned
   about system sensitivity.
 - A presentation delivered to the class.
 - A peer contribution assessment submitted individually.

2. Final Measured Configuration
--------------------------------------------------------------------------

Combine what M2 and M3 taught you into a single configuration and measure it
properly.

This is more than concatenating your best settings. Your application-level
work and your system-level configuration were tuned separately, and they
interact: the best batch size under your M3 core allocation is probably not
the one you found in M2. Re-tune the combination, and report what the
interaction cost you relative to the sum of the parts.

Tag the commit you want treated as final:

```bash
% git tag -a final -m "Final configuration"
% git push origin final
```

The tagged commit must contain the launch script, the configuration, and
everything needed to reproduce the run. Staff will bring it up from your
documented commands on a clean server. _Exact tag name and deadline: TBD._

!!! warning "Correctness still gates everything"

    A configuration that returns degraded answers has not been optimized, it
    has been broken. Verify quality on the public traces before tagging.

### 2.1. A possible class-wide comparison

Depending on how the semester goes, M4 may include a **performance bake-off**:
all groups run the same trace on identical servers and results are compared
across the class. _Whether this happens, and how it is weighted, is TBD._

If it runs, treat it as a shared measurement rather than a competition. The
interesting output is not the ranking -- it is that fourteen groups made
different design decisions on identical hardware, and the spread tells you
something none of you could have learned alone.

Two rules apply either way, because they are what make cross-group numbers
mean anything:

 - **The trace-in / results-out contract is unchanged**, including honest
   per-request timings measured from t=0.
 - **No caching of answers across runs**, and nothing precomputed against a
   specific trace. Warm indexes, connection pools, and within-batch reuse
   are fine.

3. Practical Advice
--------------------------------------------------------------------------

The following is advice, not a procedure.

 - **Combine, do not just accumulate.** Covered in Section 2 -- your M2 and
   M3 results interact, and the combination needs its own tuning pass.
 - **Look at the scheduling.** Since every request is available at t=0, your
   execution order determines the whole latency distribution. Throughput
   tuning that leaves a set of requests until last shows up in p95 and p99
   even when makespan looks fine.
 - **Harden the launch path.** Reboot, launch from scratch, run the harness.
   Twice. A pipeline that only comes up on a machine that has been warm for
   a week is not reproducible.
 - **Freeze early.** Tag a working configuration well before the deadline,
   then keep improving. A tagged adequate configuration beats an untagged
   good one.
 - **Re-measure the baseline.** Your M1 numbers are months old and were
   taken on a machine in a different state. Re-run the baseline on the
   current machine so the semester-long comparison in your report is honest.

4. The Final Report
--------------------------------------------------------------------------

The final report is a single document covering the whole project. It is not
a concatenation of your four milestone writeups -- it is the paper you would
have written if you had known at the start what you know now.

Structure it as described in the [Report
Guidelines](ece6765-report-guidelines.md):

 - [ ] **Abstract** -- the workload, what you measured, and your most
       important finding, in one paragraph
 - [ ] **Introduction** -- the workload, why a multi-component pipeline is a
       useful instrument for studying system sensitivity, and what you set
       out to learn
 - [ ] **System description** -- your pipeline as it finally stands, and the
       significant design decisions with their justification
 - [ ] **Methodology** -- machine, models, harness, how you measured, how
       you handled noise
 - [ ] **Application-level optimization** -- the M2 work, condensed to what
       mattered
 - [ ] **System-level configuration** -- the M3 work, condensed to what
       mattered
 - [ ] **End-to-end results** -- the full path from the M1 baseline to your
       final configuration, with changes attributed across all three metric
       families
 - [ ] **Sensitivity analysis** (the core of the report) -- which system
       properties this workload is sensitive to and which it is not; for each
       component, which knobs moved it, by how much, and the mechanism that
       explains it; how the bottleneck migrated as you removed each one
 - [ ] **What did not work** -- optimizations and configurations that failed,
       with diagnoses
 - [ ] **Lessons for datacenter architecture** -- what your measurements
       imply for provisioning a real deployment of this workload: what
       hardware would you specify, what would you refuse to pay for, and
       what would you colocate with what
 - [ ] **Conclusions and future work**
 - [ ] **References** and **AI assistance disclosure**

_Target length: TBD._

5. Presentation
--------------------------------------------------------------------------

Each group presents to the class. _Format, length, and date: TBD._

Present the *analysis*, not a tour of your code. The most valuable thing you
can give the class is a clear account of one sensitivity you found
surprising -- a knob that mattered far more or far less than expected -- and
what it turned out to mean. Since every group ran the same workload on the
same hardware, your surprises are directly useful to everyone else in the
room.

6. Grading
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Final configuration | _TBD_ | Staff can launch and run your tagged configuration unaided; results reproduce |
| Final report: analysis | _TBD_ | Explanation of system behavior, not a log of what you did |
| Final report: rigor | _TBD_ | Sound methodology, honest variance, claims matching evidence |
| Final report: communication | _TBD_ | Clear structure, readable figures, appropriate length |
| Negative results | _TBD_ | Failures reported and diagnosed rather than omitted |
| Presentation | _TBD_ | Clear, well-scoped, respects time |
| Peer contribution | _TBD_ | Individually submitted; adjusts individual scores |

!!! note "Speed is not on this list"

    There is no row for how fast your pipeline ended up. That is deliberate.
    A group whose final numbers are unremarkable, but who can explain
    precisely which system properties their workload is sensitive to and
    why, will outscore a group with better numbers they cannot account for.

    Absolute performance is evidence in service of the analysis, not the
    thing being graded.

7. Peer Contribution Assessment
--------------------------------------------------------------------------

Each student submits an individual, confidential assessment of their group's
division of work. _Form and deadline: TBD._ Milestone scores are shared
across the group; this is the mechanism that adjusts individual grades where
contribution was substantially uneven.

8. Tips
--------------------------------------------------------------------------

!!! tip "Write the report before you stop tuning"

    Everything except the final numbers can be written while you are still
    measuring. Groups that leave the entire report until after the last
    experiment submit a rushed one, and the report is the largest single
    component of this milestone.

!!! tip "Your best figure is probably the bottleneck-migration story"

    A single figure tracing how the limiting factor moved from M1 through
    your final configuration is the clearest way to show you understood the
    system, and it is the thing you have spent a semester earning the right
    to draw.

!!! tip "Do not break it in the last 48 hours"

    The classic failure is a late, untested change that shaves a few percent
    and quietly fails correctness. Freeze, tag, and hold risky changes behind
    a separate tag you only promote if it fully passes.
