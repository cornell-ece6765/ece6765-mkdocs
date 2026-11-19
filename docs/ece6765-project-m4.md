Milestone 4: Performance Contest
==========================================================================

This milestone is a performance contest. After the deadline, staff run
every group's final configuration on a set of hidden traces, which no group
sees before the contest, and rank the groups by a score that rewards
throughput and penalizes any loss of answer quality
([Section 4.3](#43-contest-score)). The hidden traces differ from the four
public traces in input and output sequence length
([Section 4.1](#41-hidden-traces)). You may tune on the public traces, on
traces that you build, or on both.

You may change anything behind the `POST /query` and `GET /health`
interfaces, including the models, the vector search, and the division of
the pipeline into services ([Section 3](#3-what-you-may-change)).

A public leaderboard, updated once a day, shows the score that each group
reports on the public traces. Groups whose leaderboard score rises six times
earn a participation bonus ([Section 5](#5-public-leaderboard)).

To receive credit for an optimization, `m4.md` must explain what the
optimization changes, which bottleneck it removes, and how much it changes
throughput and answer quality, as you measured it. An optimization that the
report does not explain receives no credit, however much it raises
throughput.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m4.md` plus code in your `team-XX` repo
 - **Leaderboard:** [Public Leaderboard](ece6765-leaderboard.md), updated
   once a day

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A final configuration that reaches the highest [contest
   score](#43-contest-score) you can on traces of different input and
   output sequence lengths.
 - A set of traces, the public ones and any that you build, that covers
   the input and output sequence lengths you prepared the final
   configuration for.
 - For each optimization in the final configuration, the bottleneck it
   removes and a measurement of its effect.
 - Commands that let staff launch the final configuration on a rebooted
   server and run it on any trace.

2. Your Starting Point
--------------------------------------------------------------------------

Your M4 baseline is **your own M3 best-known configuration**. Every
improvement you report in this milestone is measured against it.

 - Tag the commit of that configuration `m4-baseline` and push the tag.
 - Re-measure it on the four public traces and on every trace you build,
   in the controlled environment of [M3 Section
   3.1](ece6765-project-m3.md#31-establish-a-controlled-environment).
 - Report its results on the public traces as your first leaderboard
   update ([Section 5.1](#51-report-a-score)).

3. What You May Change
--------------------------------------------------------------------------

In this milestone you may change anything behind the `POST /query` and
`GET /health` interfaces. This includes the vector-search algorithm and
library, the chunking of the corpus and the index built over it, the
embedding and generation models, the model-serving framework, the prompt
and the decoding settings, the communication between services, request
scheduling, and the machine-state settings of M3. Unlike in M1 through M3,
the [four-service
decomposition](ece6765-project-arch.md#11-the-decomposition-is-fixed) is
not fixed either, so you may merge, split, or replace services.

The following are fixed:

 - The [`POST /query`](ece6765-project-arch.md#24-query-api) and
   [`GET /health`](ece6765-project-arch.md#25-readiness) contracts.
 - The `evaluation/` directory, which you may not modify.
 - The [rules for changing machine
   state](ece6765-project-m3.md#41-changing-machine-state) of M3, which
   protect the server that your group shares.

Every change must follow the [contest rules](#44-rules). A change that
lowers answer quality below that of the M1 baseline lowers your [contest
score](#43-contest-score).

4. The Contest
--------------------------------------------------------------------------

### 4.1. Hidden traces

Staff measure every group on the same hidden traces. A hidden trace has the
[format](ece6765-project-arch.md#22-trace-file-format) of the public traces
and queries the same CLAPNQ corpus, but no group sees it before the
contest.

Expect hidden traces that differ from the public traces, and from each
other, in input and output sequence length. The input sequence length of a
request is the number of tokens in the prompt that your generation model
reads, and its output sequence length is the number of tokens that the
model generates for the answer. The trace sets the query, which determines
part of the prompt and the answer that the evaluator expects. Your pipeline
sets the rest of the prompt, such as the instructions and the retrieved
passages.

### 4.2. How staff run the contest

Staff check out the last commit on `main` at or before the deadline and run
its final configuration on a rebooted server, using only the commands in
`m4.md`. Staff do not debug a launch that fails. They run each hidden trace
three times with the course evaluator. For each run, the evaluator reports
the [answer quality](ece6765-eval-harness.md#2-public-workloads-and-answer-quality)
and the [throughput](ece6765-eval-harness.md#32-throughput) as
`requests_per_second`, the number of requests in the trace divided by the
wall-clock time of its `POST /query`. Staff also run the released M1
baseline (`m1-release`) three times on each hidden trace.

`POST /query` returns only after the last answer of the batch completes, so
the request that completes last determines the wall-clock time. The
evaluator also reports completion-latency percentiles, which do not affect
the contest score.

### 4.3. Contest score

The contest score rewards throughput and penalizes any loss of answer
quality relative to the M1 baseline. The penalty grows faster than the
loss, so a small loss costs a small fraction of the score and a large loss
costs almost all of it.

For each hidden trace *t*, staff compute your score from the mean
`requests_per_second` and the mean quality of the three runs of your final
configuration and of the M1 baseline:

```
S_t     = RPS_t / RPS_t(M1)
L_t     = max(0, 100 * (1 - Q_t / Q_t(M1)))
score_t = S_t * 2^(-(L_t / 5)^2)
```

 - **`S_t`** is your speedup over the M1 baseline on trace *t*.
 - **`Q_t`** is your quality on trace *t*, either the ROUGE-L F1 score or
   the unanswerable accuracy, whichever applies.
 - **`L_t`** is your quality loss on trace *t*, in percent of the quality of
   the M1 baseline. On a trace with both answerable and unanswerable
   queries, `L_t` is the mean of the losses of the two quality metrics,
   weighted by the number of queries that each metric scores. A quality
   above that of the M1 baseline counts as `L_t = 0`, with no bonus.

Your contest score is the geometric mean of `score_t` across the hidden
traces, so that every trace counts equally whatever its length. The contest
ranks groups by this score.

A quality loss of 5% halves the score on a trace. The table lists the
factor by which each loss multiplies your speedup, and the speedup at which
a configuration with that loss scores the same as the M1 baseline.

| Quality loss `L_t` | Factor `2^(-(L_t / 5)^2)` | Speedup that offsets the loss |
|---:|---:|---:|
| 0% | 1.00 | 1.00x |
| 1% | 0.97 | 1.03x |
| 2% | 0.90 | 1.12x |
| 3% | 0.78 | 1.28x |
| 5% | 0.50 | 2.00x |
| 7% | 0.26 | 3.89x |
| 10% | 0.06 | 16.0x |

For example, on one trace, a configuration 4x faster than the M1 baseline
with a 3% quality loss scores 3.12, a configuration 2.5x faster with no
loss scores 2.50, and a configuration 6x faster with a 6% quality loss
scores 2.21.

!!! warning "One trace with a large quality loss lowers the whole score"

    The geometric mean multiplies the scores of all hidden traces, so a
    trace with a 10% quality loss multiplies your contest score by
    0.06^(1/*n*), where *n* is the number of hidden traces. A configuration
    that answers "unanswerable" to every query scores close to 0 on every
    trace with answerable queries, and therefore close to 0 overall. Run
    the M1 baseline on every trace you tune on, so that you can compute
    your score on it.

### 4.4. Rules

These rules keep the contest scores of the groups comparable.

 - Your pipeline generates every answer during the measured
   `POST /query`. Do not reuse an answer, or a result computed for one
   query such as its embedding or its retrieved passages, from an earlier
   request, including the [warm-up
   query](ece6765-eval-harness.md#1-what-the-harness-does), and do not
   precompute them for known queries. Loading models, building indexes,
   and opening connections before `/health` reports ready are permitted.
 - Do not train or fine-tune a model on the CLAPNQ questions or their
   reference answers.
 - Your pipeline does not recognize specific queries or traces. It may
   schedule a request by a property that it measures, such as the length
   of its text, but not by its ID or by matching its text against known
   queries.
 - Report `start_time_ms` at the time your pipeline starts work on a query
   and `last_token_ms` at the time its complete answer is ready, both in
   milliseconds from the start of the `POST /query` request, as in the
   [query API](ece6765-project-arch.md#24-query-api).

5. Public Leaderboard
--------------------------------------------------------------------------

Until the deadline, staff publish a leaderboard of the scores that groups
report on the four public traces, updated once a day. The leaderboard lets
every group follow its progress and see where it stands.

!!! info "This leaderboard is not the contest ranking"

    This leaderboard is a good-faith effort to show where each group
    stands. It ranks the scores that groups report on the public traces,
    as of the last daily update. Only the hidden traces that staff run
    after the deadline decide the contest. After the deadline, staff rerun
    each group's latest update to check that its score is reproducible
    ([Section 5.3](#53-verification-after-the-deadline)).

### 5.1. Report a score

Run the evaluator with `--runs 3` on each of the four public traces,
unchanged, and write each report to `leaderboard/` at the root of your
repository under the name of its trace:

```bash
cd /team-XX/ece6765-project/evaluation
pixi run evaluate --runs 3 \
  --trace traces/short-query-answerable.jsonl \
  --output ../leaderboard/short-query-answerable.json
```

Add `leaderboard/README.md` with the exact commands that apply the machine
state on a rebooted server, launch the configuration that produced the
reports, and run the evaluator on a trace. Commit the four reports and
`leaderboard/README.md`, and push the commit to `main`. This commit is your
update, and it must contain the configuration that produced the reports.
The [contest rules](#44-rules) apply to every configuration that you
report.

### 5.2. How updates count

Once a day, a staff script reads `leaderboard/` on `main` of every group
repository. It scores a group only when all four reports are present, each
from three measured runs of an unchanged public trace. It recomputes answer
quality from the answers in each report, and it computes the leaderboard
score with the formula of [Section 4.3](#43-contest-score), applied to the
four public traces and to reports of `m1-release` that staff measured on
them. The script also stores a copy of each report with the hash of its
commit, so a later change to the history of `main` does not change the
record.

An update counts toward the participation bonus when its leaderboard score
is at least 2% higher than that of your previous counted update. Your first
scored update counts. The script reads `main` once a day, so it counts at
most one update per day, and six counted updates require at least six days.
The 2% margin keeps run-to-run variation from counting as an improvement.

### 5.3. Verification after the deadline

After the deadline, staff check out the commit of your latest counted
update, reboot your server, follow `leaderboard/README.md` in that commit,
and run each public trace three times. Staff may also rerun one earlier
counted update, chosen at random, in the same way. You lose the
participation bonus in either of these cases:

 - A rerun scores below 90% of the leaderboard score of the update that it
   reruns.
 - The configuration of a counted update breaks the [contest
   rules](#44-rules), for example by looking up the reference answers of
   the public queries.

6. What to Do
--------------------------------------------------------------------------

### 6.1. Choose the traces you tune on

You may tune on the public traces, build new traces, or both. Each public
trace contains 100 queries and separates short from long queries and
answerable from unanswerable ones. A configuration tuned on one mix of
queries can lose throughput on another, and the hidden traces differ from
the public ones.

The released evaluator accepts a trace at any path and scores any trace
built from the 400 queries of the public traces, with their IDs and text
unchanged, in any subset, mix, size, and order. It rejects a query that no
public trace contains, because it has no reference answer for it. To
measure a query that no public trace contains, for example a longer one,
send it to `POST /query` with your own client. Such a run measures
throughput and latency but not answer quality.

Commit every trace you build, and the script that built it, outside
`evaluation/`.

### 6.2. Optimize, and measure each optimization

Base each optimization on a measurement that shows the bottleneck it
targets, from your M2 and M3 work or from new profiling, and re-profile
when an optimization moves the bottleneck. Measure the effect of each
optimization on throughput and answer quality against the same
configuration without it, on traces of different input and output sequence
lengths. Optimizations interact, so state how you isolated each one.

Follow the [M3 methodology
requirements](ece6765-project-m3.md#4-methodology-requirements). Measure
in a controlled environment, repeat each configuration, and report the mean
with an error bound. Report an effect smaller than the run-to-run variation
as indistinguishable from noise.

### 6.3. Launch from a rebooted server

Staff launch your final configuration on a rebooted server from the
commands in `m4.md` alone. Settings applied at runtime, such as the clock
frequency, huge pages, and page migration, are lost at reboot, so your
committed scripts must apply them. Before you commit a final configuration
to `main`, reboot your server, run the commands in `m4.md` exactly as
written, and run the evaluator on a trace.

7. What to Submit
--------------------------------------------------------------------------

Commit your final configuration, your traces and scripts, and your results,
push the `m4-baseline` tag, and add a file named `m4.md` at the repository
root containing:

 - [ ] **Title and group members**
 - [ ] **Starting point:** the `m4-baseline` commit and its re-measured
       results on the four public traces and on your own traces
 - [ ] **Traces:** the traces you tuned and evaluated on, how you built
       each new one, and the range of input and output sequence lengths
       it covers
 - [ ] **Optimizations** (the core of the report): for each optimization
       in the final configuration, what you changed, the bottleneck it
       targets and the measurement that identified it, how you isolated
       its effect, and its measured effect on throughput and answer
       quality across input and output sequence lengths
 - [ ] **Final configuration:** throughput, the completion-latency
       distribution, and answer quality on every trace you evaluated,
       with run-to-run variation, compared with the M4 baseline
 - [ ] **What did not work:** optimizations you tried and dropped, with
       the diagnosis of why each one did not help
 - [ ] **How to run it:** exact commands that install every model,
       library, and index that you added, apply the machine state on a
       rebooted server, launch the final configuration, run the evaluator
       on a trace at any path, and restore the defaults
 - [ ] **AI assistance disclosure**, as described in the [Report
       Guidelines](ece6765-report-guidelines.md#7-use-of-ai-assistants)

Follow the [Report Guidelines](ece6765-report-guidelines.md).

```bash
git add m4.md img/ results/ scripts/ traces/ <your config directory>
git commit -m "Milestone 4 submission"
git push
git push origin m4-baseline
```

The submission is the last commit on `main` at or before the deadline, and
staff run the final configuration in that commit.

8. Tips
--------------------------------------------------------------------------

!!! tip "Report your first score early"

    The leaderboard counts at most one update a day, and each counted
    update must raise your score by 2%. Report your M4 baseline in the
    first days of the milestone, and report a new score after each
    optimization that you measure.

!!! tip "Keep `main` launchable"

    Staff run the last commit on `main` at or before the deadline, so a
    late commit that breaks the launch or lowers answer quality replaces a
    working final configuration. Develop risky changes on a branch, and
    merge one only after it launches on a rebooted server and raises your
    contest score on the traces you have.

!!! tip "Find out what the last requests wait for"

    The throughput of a trace depends on when its last answer completes.
    From the per-query timestamps, plot when each request starts and
    completes, and check which services are idle while the last requests
    finish.
