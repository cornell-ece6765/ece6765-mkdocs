Evaluation Harness and Metrics
==========================================================================

The evaluation harness is course-provided. It is the single source of truth
for both correctness and performance: every milestone number you report, and
your contest standing, comes out of it. This page describes what it does and
how it scores you.

!!! warning "Draft"

    The harness is under development. Endpoint details, exact metric
    definitions, and score thresholds marked _TBD_ below will be fixed
    before Milestone 1 is released. The structure described here will not
    change.

1. What the harness does
--------------------------------------------------------------------------

1. Polls `GET /health` until your pipeline reports ready. Model loading and
   index construction happen here and are **not** timed.
2. Submits the query set to `POST /query` on your frontend. In the default
   mode it submits **the entire set in one request**, all at once, and then
   waits.
3. Records per-response timing and collects the answer text, matched to
   queries by `id`.
4. Scores answer quality, then reports performance metrics.

The all-at-once submission is deliberate. It means the harness does not
model an arrival process -- it hands you the full offered load immediately
and measures how well you drain it. Your pipeline is free to internally
schedule, batch, and reorder that work however it likes, which is precisely
the design space the project explores.

2. Dataset and answer quality
--------------------------------------------------------------------------

Queries and ground-truth answers come from **ClapNQ**, a long-form RAG
benchmark built from Natural Questions, where answers are grounded in
retrieved passages rather than extracted spans.

Answer quality is scored against the ClapNQ reference answers using the
benchmark's own metrics. _Exact metric set and the passing threshold: TBD._

Two properties of the scoring matter for how you engineer the pipeline:

**It is a gate, not a gradient.** Above the quality threshold, a better
answer score does not improve your performance standing. Below it, your
performance numbers do not count at all.

**A held-out set is used for the contest.** The query set you develop
against is public. Your contest run uses queries you have not seen, drawn
from the same distribution. Caching answers, overfitting retrieval
parameters to the public set, or any other strategy that does not generalize
will be caught here.

!!! danger "Do not cache across the run"

    Memoizing responses by query text, or precomputing answers for the
    public query set, is not an optimization -- it is a way to score zero.
    Caching *within* the serving path (a warmed index, a reused KV cache
    across a batch, a persistent connection pool) is fine and expected. The
    line is whether your pipeline would still work on a query it has never
    seen.

3. Performance metrics
--------------------------------------------------------------------------

The harness reports three families of numbers.

### 3.1. Time to first token (TTFT)

Wall-clock time from request submission to the first token of a given
response. This is the metric that punishes deep pipelining and large
batches: a batching strategy that improves throughput by holding requests
until a batch fills will show up here immediately.

Reported as a distribution: p50, p95, p99, and max.

### 3.2. Total generation time (throughput)

Wall-clock time from submission of the full query set to the last completed
response. Since the harness submits everything at once, this is effectively
the makespan of the whole workload, and it is the headline throughput
number.

Also reported normalized as queries per second over the run.

### 3.3. Tail latency

End-to-end per-query latency -- submission to complete response -- reported
as p50, p95, p99, p99.9, and max.

!!! note "Why all three"

    These metrics are in tension, and that tension is the point. Increasing
    batch size at the embedding service will usually improve total
    generation time and worsen TTFT. Aggressive queueing improves
    utilization and worsens the tail. A submission that optimizes one
    number into the ground while destroying the others is not a good
    submission, and the contest scoring reflects that. _Exact contest
    weighting across the three: TBD._

4. Running the harness yourself
--------------------------------------------------------------------------

You run the same harness the staff runs, on your own server, as often as you
like:

```bash
% ./scripts/launch.sh                    # bring up your pipeline
% ece6765-harness run --queries public   # _exact CLI: TBD_
```

Output is a JSON results file plus a summary table. Commit the summary files
to `results/` in your repo; that is what your milestone writeups should cite.

### 4.1. Measurement discipline

The harness will happily give you a number from a single run. That number is
not a result.

 - **Repeat runs.** Report a minimum of _TBD_ runs per configuration with
   variation across them, not a single number.
 - **Discard warmup.** The first run after a service starts is not
   representative. The harness supports a warmup pass; use it, and say in
   your writeup that you did.
 - **Control the machine.** Another group's job is not running on your
   server, but your own stray processes might be. See the [Server and
   Measurement Guide](ece6765-server-guide.md) for a checklist.
 - **Change one thing.** If you change batch size and core count in the same
   experiment, you have learned nothing about either.

5. Local correctness testing
--------------------------------------------------------------------------

Before running timed experiments, check that your pipeline is actually
correct. The harness supports a fast correctness-only mode over a small
query subset:

```bash
% ece6765-harness check --queries smoke   # _exact CLI: TBD_
```

Run this after every change. The most expensive failure mode in this project
is spending a week optimizing a pipeline that has been silently returning
degraded answers since Tuesday -- especially since most of the optimizations
you will try (batching, quantization, reduced `k`, transport changes) are
exactly the kind that can quietly damage answer quality.
