Evaluation Harness and Metrics
==========================================================================

The evaluation harness is course-provided. It is the single source of truth
for both correctness and performance: every milestone number you report
comes out of it, which is what makes results comparable across groups. 

!!! warning "Draft"

    The harness is under development. Endpoint details, exact metric
    definitions, and score thresholds marked _TBD_ below will be fixed
    before Milestone 1 is released. 

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
scheduler. 

Because everything is available immediately, **you own the scheduling
decision entirely.** Nothing requires you to run requests in trace order.

2. Dataset and answer quality
--------------------------------------------------------------------------

Queries and staff-held ground-truth answers come from **ClapNQ**.

Answer quality is scored against _TBD_

Two properties of the scoring matter for how you engineer the pipeline:

**It is a gate, not a gradient.** Above the quality threshold, a better
answer score does not improve your performance standing. Below it, your
performance numbers do not count.

**Held-out traces exist.** The traces you develop against are public, but
staff evaluation may use a trace you have not seen, drawn from the same
distribution. Beyond catching shortcuts, this is a genuine measurement
question: a configuration tuned to one trace may not hold on another, and
knowing whether your findings generalize is part of the work.

!!! danger "Do not cache across runs"

    Memoizing answers by query text, or precomputing results for the public
    traces, is not an optimization -- it is a way to score zero. Caching
    *within* the serving path (a warmed index, a reused KV cache across a
    batch, a persistent connection pool) is fine and encouraged. The line is
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

### 3.2. Throughput

Requests per second over the run: the number of requests in the trace
divided by the wall-clock time from t=0 until the last one completes.

This is the headline throughput number, and the harness also measures that
wall clock externally as a check on your self-reported timings.

!!! note "Max latency and throughput are the same measurement"

    Since every request is available at t=0, the request that finishes last
    finishes at exactly the total run time -- so **p100 latency and the run
    time behind your throughput number are mathematically identical here**.

    The distinction that survives is between the *tail* and the *body* of
    the distribution. Throughput tells you how long the whole workload took;
    p50 and p95 tell you how your scheduler distributed waiting across
    requests. A pipeline can improve p50 substantially -- by running short
    requests first -- without moving its throughput at all, and it can
    improve throughput while making p50 much worse.

### 3.3. What this means for optimization

The two metrics push in different directions:

 - **Throughput** rewards keeping every resource busy: large batches, deep
   pipelining, high utilization, and no idle services.
 - **p50 latency** rewards finishing individual requests quickly once
   started, and running cheap requests early.

The tension between them is the whole point. Large batches raise throughput
and make the requests that wait for a batch to fill wait longer; a schedule
that runs cheap requests first improves p50 and can leave a service idle at
the end of the run.

Reporting both, and being explicit about which you traded away, is expected
in every milestone writeup.

4. Running the harness yourself
--------------------------------------------------------------------------

You run the same harness the staff runs, on your own server, as often as you
like:

```bash
% ece6765-harness run --trace traces/short-query-answerable.jsonl   # _exact CLI: TBD_
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
   provided traces, not just a single one.
 - **Discard warmup.** The first run after a service starts is not
   representative. The harness supports a warmup pass.
 - **Control the machine.** Another group's job is not running on your
   server, but your own stray processes might be. See the [Server and
   Measurement Guide](ece6765-server-guide.md) for a checklist.
 - **Change one thing.** If you change batch size and core count in the same
   experiment, you have learned nothing about either.

5. Local correctness testing
--------------------------------------------------------------------------

Before running timed experiments, check that your pipeline is actually
correct. The harness supports a correctness-only mode over a selected
public trace:

```bash
% ece6765-harness check --trace traces/short-query-answerable.jsonl   # _exact CLI: TBD_
```
