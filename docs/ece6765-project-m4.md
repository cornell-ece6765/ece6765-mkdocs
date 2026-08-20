Milestone 4: Performance Contest and Final Report
==========================================================================

The last milestone has two parts. The first is a **performance engineering
contest**: every group runs the same workload on identical servers, and we
rank the results. The second is the **final report**, which ties together
everything from M1 through M4 into a single coherent account of what you
built, what you learned, and why the system behaves the way it does.

The report is worth more than the ranking. Read Section 6 before you spend
your last week chasing another two percent.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/index.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for all
deadlines.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m4.md` plus a tagged contest commit
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A final, tuned pipeline submitted to the contest, reproducible from a
   tagged commit and a committed configuration.
 - A final report covering the full semester's work.
 - A presentation delivered to the class.
 - A peer contribution assessment submitted individually.

2. The Contest
--------------------------------------------------------------------------

### 2.1. How it works

 - All groups run on **identical, dedicated Ampere servers** with the same
   machine state.
 - The staff run the [evaluation harness](ece6765-eval-harness.md) against a
   **held-out query set** drawn from the same distribution as the public set.
 - Your entry is whatever is at your tagged contest commit. The staff bring
   it up using **your committed launch script and config**, unaided.
 - Ranking is over TTFT, total generation time, and tail latency. _Exact
   weighting: TBD._

### 2.2. Rules

!!! danger "Correctness gates everything"

    Your entry must clear the answer-quality threshold on the held-out
    query set. Below it, your performance numbers do not count and the entry
    scores zero. Verify against the public set repeatedly before submitting
    -- an entry that fails correctness on contest day cannot be resubmitted.

 - **The `POST /query` and `/health` contract is unchanged.** How many
   processes sit behind it, and how they are organized, is entirely yours.
 - **No caching of answers across the run**, and nothing precomputed against
   the public query set. Warm indexes, connection pools, and within-batch
   reuse are fine. The test is whether your pipeline works on a query it has
   never seen.
 - **Fixed models.** The specified embedding and generation models, as
   given. This is the only constraint on your implementation besides the
   API contract.
 - **It must come up from your script.** If the staff cannot launch your
   pipeline from your documented command on a clean server, the entry does
   not run. Test this on a freshly rebooted machine before submitting.
 - **No cross-group sharing** of code, configs, or tuning parameters.

### 2.3. Submitting

Tag the commit you want judged:

```bash
% git tag -a contest -m "Contest submission"
% git push origin contest
```

The tagged commit must contain the launch script, the configuration, and
everything needed to reproduce the run. _Submission deadline and exact tag
name: TBD._

3. Final Preparation
--------------------------------------------------------------------------

The following is advice, not a procedure. How you spend the run-up to the
contest is your call.


 - **Combine, do not just accumulate.** Your M2 application optimizations
   and M3 system configuration were tuned separately. They interact. The
   best batch size under your M3 core allocation is probably not the one you
   found in M2 -- re-tune the combination.
 - **Look at the tail.** Throughput tuning tends to wreck tail latency, and
   the contest scores both. Find where your worst requests are going.
 - **Harden the launch path.** Every semester some entry fails because a
   service crashed on startup on a clean machine. Reboot, launch from
   scratch, run the harness. Twice.
 - **Freeze early.** Tag a working entry well before the deadline, then keep
   improving. A tagged mediocre entry beats an untagged great one.

4. The Final Report
--------------------------------------------------------------------------

The final report is a single document covering the whole project. It is not
a concatenation of your four milestone writeups -- it is the paper you would
have written if you had known at the start what you know now.

Structure it as described in the [Report
Guidelines](ece6765-report-guidelines.md):

 - [ ] **Abstract** -- the project and headline result in one paragraph
 - [ ] **Introduction** -- the workload, why its service structure makes it
       an interesting systems problem, and what you set out to learn
 - [ ] **System description** -- your pipeline as it finally stands, and the
       significant design decisions with their justification
 - [ ] **Methodology** -- machine, models, harness, how you measured, how
       you handled noise
 - [ ] **Application-level optimization** -- the M2 work, condensed to what
       mattered
 - [ ] **System-level configuration** -- the M3 work, condensed to what
       mattered
 - [ ] **End-to-end results** -- the full path from the M1 baseline to your
       contest entry, with speedup attributed across all three metric
       families
 - [ ] **Analysis** (the core of the report) -- what limited this workload,
       how the bottleneck moved as you removed each one, and which knobs
       mattered for which services
 - [ ] **What did not work** -- optimizations and configurations that failed,
       with diagnoses
 - [ ] **Lessons for datacenter architecture** -- what your measurements
       imply for provisioning a real deployment of this workload
 - [ ] **Conclusions and future work**
 - [ ] **References** and **AI assistance disclosure**

_Target length: TBD._

5. Presentation
--------------------------------------------------------------------------

Each group presents to the class. _Format, length, and date: TBD._

Present the *analysis*, not a tour of your code. The most valuable thing you
can give the class is a clear account of one thing you found surprising and
what it turned out to mean.

6. Grading
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Contest standing | _TBD_ | Ranked performance on the held-out set, correctness gate cleared |
| Reproducibility of entry | _TBD_ | Staff can launch and run your tagged entry unaided |
| Final report: analysis | _TBD_ | Explanation of system behavior, not a log of what you did |
| Final report: rigor | _TBD_ | Sound methodology, honest variance, claims matching evidence |
| Final report: communication | _TBD_ | Clear structure, readable figures, appropriate length |
| Negative results | _TBD_ | Failures reported and diagnosed rather than omitted |
| Presentation | _TBD_ | Clear, well-scoped, respects time |
| Peer contribution | _TBD_ | Individually submitted; adjusts individual scores |

!!! note "The ranking is not the grade"

    Contest standing is one row in this table. A mid-pack group that
    explains precisely why their pipeline sits where it does, with evidence,
    will outscore a group that placed first and cannot account for their own
    configuration. The contest exists to make the optimization problem
    concrete and competitive -- not to convert the project into a
    leaderboard.

7. Peer Contribution Assessment
--------------------------------------------------------------------------

Each student submits an individual, confidential assessment of their group's
division of work. _Form and deadline: TBD._ Milestone scores are shared
across the group; this is the mechanism that adjusts individual grades where
contribution was substantially uneven.

8. Tips
--------------------------------------------------------------------------

!!! tip "Write the report before the contest ends"

    Everything except the final numbers can be written while you are still
    tuning. Groups that leave the whole report for after the contest submit
    a rushed one and lose more points there than they gained in ranking.

!!! tip "Your best figure is probably the bottleneck-migration story"

    A single figure tracing how the limiting factor moved from M1 through
    your final configuration is the clearest way to show you understood the
    system, and it is the thing you have spent a semester earning the right
    to draw.

!!! tip "Do not break it in the last 48 hours"

    The classic failure is a late, untested optimization that shaves 4% in
    testing and fails correctness on the held-out set. Freeze, tag, and hold
    risky changes behind a separate tag you only promote if it fully passes.
