Evaluation Harness and Metrics
==========================================================================

The evaluation harness is course-provided. It is the single source of truth
for both correctness and performance: every milestone number you report
comes out of it, which is what makes results comparable across groups. This page describes what it does and
how it scores you.

!!! warning "Draft"

    The harness is under development. Endpoint details, exact metric
    definitions, and score thresholds marked _TBD_ below will be fixed
    before Milestone 1 is released. The structure described here will not
    change.

1. What the harness does
--------------------------------------------------------------------------

1. Launches your pipeline and polls `GET /health` until it reports ready.
   Model loading and index construction happen here and are **not** timed.
2. Starts the run by invoking your pipeline with a **trace file** of
   requests and an output path. This instant is **t=0**.
3. Waits for your pipeline to finish and write its results file, measuring
   total wall-clock time externally.
4. Scores answer quality against the reference answers, cross-checks your
   self-reported timings against the wall clock, and computes the
   performance metrics.

The trace contains every request up front: all of them are available to your
pipeline at t=0, with no arrival process and no rate limit. This models a
server that has already been handed a full queue of work by an upstream
scheduler. See [the execution
model](ece6765-project-arch.md#21-the-execution-model) for the interface.

Because everything is available immediately, **you own the scheduling
decision entirely.** Nothing requires you to run requests in trace order.

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

**Held-out traces exist.** The traces you develop against are public, but
staff evaluation may use a trace you have not seen, drawn from the same
distribution. Beyond catching shortcuts, this is a genuine measurement
question: a configuration tuned to one trace may not hold on another, and
knowing whether your findings generalize is part of the work.

!!! danger "Do not cache across runs"

    Memoizing answers by query text, or precomputing results for the public
    traces, is not an optimization -- it is a way to score zero. Caching
    *within* the serving path (a warmed index, a reused KV cache across a
    batch, a persistent connection pool) is fine and expected. The line is
    whether your pipeline would still work on a query it has never seen.

3. Performance metrics
--------------------------------------------------------------------------

All per-request times are measured **from t=0**, not from when your pipeline
chose to start working on a given request. Every number below therefore
includes queuing delay as well as processing time.

### 3.1. Per-request latency

For each request: `last_token_ms`, the time from t=0 until its final token
is generated. Reported as a distribution -- p50, p95, p99, p99.9, and max.

This is the metric that makes your **scheduling policy** visible. A request
your pipeline leaves until the end of the run carries the entire queuing
delay of everything you ran before it. Two pipelines with identical
throughput can have completely different latency distributions purely
because of the order in which they drained the queue.

### 3.2. Time to first token (TTFT)

For each request: `first_token_ms`, the time from t=0 until its first token
is emitted. Also reported as a distribution.

The gap between TTFT and per-request latency tells you how much of a
request's life was spent waiting versus generating. Aggressive batching
tends to widen the queuing portion for the requests that lose the batching
lottery.

### 3.3. Makespan (total generation time)

Wall-clock time from t=0 until the last request completes. This is the
headline throughput number, and it is also measured externally by the
harness as a check on your self-reported timings.

Also reported normalized as requests per second over the run.

!!! note "Max latency and makespan are the same number"

    Since every request is available at t=0, the request that finishes last
    finishes at exactly the makespan. **p100 latency and total generation
    time are mathematically identical here** -- they are not two independent
    things to optimize.

    The distinction that survives is between the *tail* and the *body* of
    the distribution. Makespan tells you how long the whole workload took;
    p50 and p95 tell you how your scheduler distributed waiting across
    requests. A pipeline can improve p50 substantially -- by running short
    requests first -- without moving its makespan at all, and it can improve
    makespan while making p50 much worse. Those really are in tension.
    Do not report them as though they were independent.

### 3.4. What this means for optimization

The three metrics push in different directions, and reconciling them is the
project:

 - **Makespan** rewards keeping every resource busy: large batches, deep
   pipelining, high utilization, and no idle services.
 - **p50 latency** rewards finishing individual requests quickly once
   started, and running cheap requests early.
 - **TTFT** punishes holding a request while you wait for a batch to fill.

Reporting all three, and being explicit about which you traded away, is
expected in every milestone writeup.

4. Running the harness yourself
--------------------------------------------------------------------------

You run the same harness the staff runs, on your own server, as often as you
like:

```bash
% ece6765-harness run --trace traces/public-1k.jsonl   # _exact CLI: TBD_
```

The harness handles launching your pipeline, waiting for `/health`, timing
the run, and scoring the output.

Output is a JSON results file plus a summary table. Commit the summary files
to `results/` in your repo; that is what your milestone writeups should cite.

### 4.1. Measurement discipline

The harness will happily give you a number from a single run. That number is
not a result.

 - **Repeat runs.** Report a minimum of _TBD_ runs per configuration with
   variation across them, not a single number.
 - **Vary the trace.** A schedule tuned to one trace can fail on another
   with a different mix of query lengths. Check your results across the
   provided traces, not just your favorite one.
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
% ece6765-harness check --trace traces/smoke.jsonl   # _exact CLI: TBD_
```

Run this after every change. The most expensive failure mode in this project
is spending a week optimizing a pipeline that has been silently returning
degraded answers since Tuesday -- especially since most of the optimizations
you will try (batching, quantization, reduced `k`, transport changes) are
exactly the kind that can quietly damage answer quality.
