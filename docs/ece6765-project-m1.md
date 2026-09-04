Milestone 1: Baseline Instrumentation and Characterization
==========================================================================

In this milestone you start from the course-provided four-service RAG
pipeline, add observability, and characterize the frozen baseline. Your central
question is: **where does the time go?** Performance optimization is explicitly
not the goal yet.

 - **Deadline:** see the [course
   schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m1.md` plus code in your private `team-XX`
   repository
 - **Server checkout:** `/team-XX/ece6765-project/`

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A working copy of the released [four-service
   pipeline](ece6765-project-arch.md#11-the-decomposition-is-fixed) that
   preserves the external [query contract](ece6765-project-arch.md#24-query-api).
 - Enough internal timing instrumentation to give a quantitative, defensible
   answer to **where does time go in this pipeline?**
 - One public harness report for each of the four provided traces, including
   answer quality, throughput, and the required latency percentiles.
 - A detailed time breakdown for at least one identified public trace.
 - Exact commands that let staff reproduce the measurements on your team's
   server.

2. What to Do
--------------------------------------------------------------------------

### 2.1. Set up the released baseline

Log in to your assigned server (see the [Server and Measurement
Guide](ece6765-server-guide.md)), clone your private repository at
`/team-XX/ece6765-project/` (see the [Git
Workflow](ece6765-git-workflow.md)), and follow `template/README.md` in that
repository.

Before adding instrumentation, confirm that the released implementation
starts, reports healthy, answers a small request, and passes its tests.

### 2.2. Preserve the baseline

The released implementation is the M1 baseline. Do not change its application
logic, configuration, dependency versions, or `evaluation/` code.

You may add instrumentation, observability dependencies and their lockfile
entries, and internal correlation metadata. These additions must not change
the external `POST /query` or `/health` contracts or the answers produced.

### 2.3. Instrument the pipeline

Add an observability layer that lets you answer quantitatively:

> **Where does time go in this pipeline?**

At minimum, distinguish embedding, vector search, generation, and any material
remaining overhead. You choose the timer placement, telemetry format, and
analysis method. No particular aggregation script, notebook, profiler, or
dashboard is required.

In the report, define where each measured interval begins and ends, identify
any overlap, and quantify any end-to-end time your categories do not explain.
The existing response timing fields remain part of the fixed [query
contract](ece6765-project-arch.md#24-query-api).

The evaluator compares its external wall clock with the maximum reported
`last_token_ms`. That consistency check is diagnostic only in M1; it is not a
separate grading threshold.

### 2.4. Measure the four public traces

Run each public 100-query trace **once** with the released [evaluation
harness](ece6765-eval-harness.md):

 - `short-query-answerable.jsonl`
 - `long-query-answerable.jsonl`
 - `short-query-unanswerable.jsonl`
 - `long-query-unanswerable.jsonl`

The evaluator performs an unmeasured warm-up using the first trace record.
Exclude the warm-up invocation from the detailed breakdown, not that query ID;
the same record appears again in the measured batch.

For every trace, report:

 - the applicable public answer-quality score;
 - throughput in requests per second; and
 - completion-latency p50, p95, p99, and maximum.

The public quality scores are descriptive in M1. There is no score threshold
to clear and no credit for changing the frozen baseline to raise them.

Staff will launch the submitted application using your documented command,
then send a small batch of unseen queries to the frontend. This checks startup
and health, the API, response IDs and cardinality, nonempty answers, valid
timestamps, and obviously broken or workload-specific behavior. It is not a
hidden accuracy test and produces no private accuracy grade; ambiguous
semantic behavior is reviewed by a person rather than a hidden score cutoff.

### 2.5. Answer the measurement question

For at least one identified public trace, present a figure or table showing
where end-to-end time goes. Explain the measurement method, identify the
dominant stage or stages, and support that conclusion with the data.

3. What to Submit
--------------------------------------------------------------------------

Commit your instrumentation changes and a file named `m1.md` at the repository
root containing:

 - [ ] **Title and group members** -- project title, plus the name and
       NetID of every group member
 - [ ] **Baseline confirmation** -- released version and confirmation that
       the frozen functional configuration was preserved
 - [ ] **Instrumentation and methodology** -- measurement boundaries,
       overlap, and any unattributed time
 - [ ] **How to run it** -- exact commands to launch the pipeline and run the
       harness on a clean server
 - [ ] **Public results** -- quality, throughput, and p50/p95/p99/maximum
       completion latency for one run of each public trace
 - [ ] **Time breakdown** -- a figure or table for at least one identified
       public trace
 - [ ] **Interpretation** -- which stage or stages dominate and what evidence
       supports that conclusion
 - [ ] **Division of labor** -- who owns which service going forward
 - [ ] **Status and blockers** -- what is not working and what you are stuck
       on

Figures go in `img/`; harness reports and small result summaries go in
`results/`.

```bash
cd /team-XX/ece6765-project
git add -A
git commit -m "Milestone 1 submission"
git push
```

The submission is the last commit on `main` at or before the deadline.

Feedback will be pushed to your group repository as
`m1-feedback-<DATE>.md` after the deadline.

4. Tips
--------------------------------------------------------------------------

These are offered as engineering judgment from past performance projects.
None of them are requirements.

!!! tip "Budget for friction"

    The dominant cost may be understanding unfamiliar code, getting
    dependencies and models running on ARM64, and deciding where a timer
    belongs. Start early enough to distinguish an instrumentation problem
    from an environment problem.

!!! tip "Keep checking behavior"

    Instrumentation can accidentally change ordering, data flow, or answers.
    Run the tests and a small request after every substantive change.

!!! tip "Do not optimize in M1"

    Groups that arrive at M2 with an already-tuned pipeline have no baseline
    to compare against. The naive version is an asset.

!!! tip "Watch the vector serialization"

    The frontend's vector-search request moves a full dense vector as a JSON
    array of floats. You are not asked to fix this in M1, but instrument it so
    that a later change can quantify what it cost.
