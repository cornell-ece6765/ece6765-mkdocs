Evaluation Harness and Metrics
==========================================================================

The evaluation harness is course-provided. It is the single source of truth
for both correctness and performance: every milestone number you report
comes out of it, which is what makes results comparable across groups. 

!!! warning "Draft"

    The harness is under development. Metric definitions and score
    thresholds marked _TBD_ below will be fixed before Milestone 1 is
    released.

1. What the harness does
--------------------------------------------------------------------------

1. Launches your pipeline and polls `GET /health` until it reports ready.
   Model loading and index construction happen here and are **not** timed.
2. Loads the selected trace and submits its queries to `POST /query`,
   measuring total wall-clock time externally.
3. Scores answer quality against the reference answers, cross-checks your
   self-reported timings against the wall clock, and computes the
   performance metrics.
4. Writes a JSON report and prints a summary table.

The trace contains every request up front: all of them are available to your
pipeline at t=0, with no arrival process and no rate limit. This models a
server that has already been handed a full queue of work by an upstream
scheduler.

2. Dataset and answer quality
--------------------------------------------------------------------------

Queries and staff-held ground-truth answers come from **CLAPNQ**.

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
    *within* the serving path (a loaded index, a reused KV cache, a
    persistent connection pool) is fine and encouraged. The line is whether
    your pipeline would still work on a query it has never seen.

3. Performance metrics
--------------------------------------------------------------------------

All per-request times are measured **from t=0**, not from when your pipeline
chose to start working on a given request. Every number below therefore
includes queuing delay as well as processing time.

### 3.1. Per-request latency

For each request: `last_token_ms`, the time from t=0 until its final token
is generated. Reported as a distribution -- p50, p95, p99, p99.9, and max.

The distribution captures both processing time and time spent waiting for
resources inside the pipeline.

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
    p50 and p95 describe the experience of individual requests.

### 3.3. What this means for optimization

The two metrics push in different directions:

 - **Throughput** rewards pipelining, concurrency, batching, and high
   utilization.
 - **p50 latency** rewards finishing individual requests quickly.

Optimizations can affect throughput and latency differently, so measure and
report both.

Reporting both, and being explicit about which you traded away, is expected
in every milestone writeup.

4. Running the harness yourself
--------------------------------------------------------------------------

You run the same harness the staff runs, on your own server, as often as you
like:

```bash
cd evaluation
EMBEDDINGS_PATH=/team-XX/embeddings.npy pixi run evaluate \
  --trace traces/short-query-answerable.jsonl
```

The harness handles launching your pipeline, waiting for `/health`, timing
the run, and scoring the output.

The evaluator writes a JSON report under `results/` and prints a summary
table. Cite summarized results in your milestone writeups.

### 4.1. Measurement discipline

 - **Characterize variation.** Establish the run-to-run noise before
   claiming a small improvement.
 - **Vary the trace.** A configuration tuned to one trace can fail on
   another with a different mix of query lengths.
 - **Control the machine.** Another group's job is not running on your
   server, but your own stray processes might be. See the [Server and
   Measurement Guide](ece6765-server-guide.md) for a checklist.
 - **Change one thing.** If you change the protocol and core count in the
   same experiment, you have learned nothing about either.
