Evaluation Harness and Metrics
==========================================================================

The course-provided evaluation harness is the source of truth for public
answer-quality scores, end-to-end latency, and throughput. It drives every
group's pipeline through the same external API so results are comparable. It
does not measure time inside the four services.

1. What the harness does
--------------------------------------------------------------------------

1. Launches your pipeline and polls `GET /health` until it reports ready.
   Model loading and index construction happen here and are **not** timed.
2. Submits the first query from the selected trace as an unmeasured warm-up.
3. Submits the complete selected trace in one `POST /query`, measuring the
   request with an external wall clock.
4. Scores the returned answers against the public references and computes the
   performance metrics.
5. Writes a JSON report and prints a summary table.

The trace contains every request up front: all of them are available to your
pipeline at t=0, with no arrival process and no rate limit. This models a
server that has already been handed a full queue of work by an upstream
scheduler.

2. Public workloads and answer quality
--------------------------------------------------------------------------

The repository provides four 100-query workloads derived from **CLAPNQ**:

| Trace | Contents | Public quality metric |
|-------|----------|-----------------------|
| `short-query-answerable.jsonl` | 100 short answerable queries | Mean stemmed ROUGE-L F1 |
| `long-query-answerable.jsonl` | 100 long answerable queries | Mean stemmed ROUGE-L F1 |
| `short-query-unanswerable.jsonl` | 100 short unanswerable queries | Exact unanswerable accuracy |
| `long-query-unanswerable.jsonl` | 100 long unanswerable queries | Exact unanswerable accuracy |

Both metrics use a 0--100 scale. On an unanswerable trace, only an answer
whose stripped text is exactly `unanswerable` counts as an abstention.

3. Performance metrics
--------------------------------------------------------------------------

For each `POST /query`, the frontend uses the start of its request processing
as a common t=0. All per-query timestamps are measured from that origin, so
they include time spent waiting inside the pipeline.

### 3.1. Completion latency

For each query, `last_token_ms` is the time from t=0 until its completed answer
is available at the frontend. It is reported as p50, p95, p99, and maximum.

The distribution captures both processing time and time spent waiting for
resources inside the pipeline.

The evaluator compares the maximum `last_token_ms` with its external wall
clock and warns if the terminal completion times are inconsistent. This is a
diagnostic; it does not fail the evaluation.

### 3.2. Throughput

Requests per second over the run: the number of requests in the trace
divided by the externally measured wall-clock duration of `POST /query`.

This is the headline throughput number. It uses the harness's external wall
clock rather than the frontend's per-query timestamps.

### 3.3. What this means for optimization

The two metrics push in different directions:

 - **Throughput** rewards pipelining, concurrency, batching, and high
   utilization.
 - **Completion-latency percentiles** reflect how quickly queries finish.

Optimizations can affect throughput and latency differently, so measure and
report both.

When comparing configurations, report both and explain any tradeoff.

4. Running the harness
--------------------------------------------------------------------------

From the `evaluation/` directory of the canonical team checkout, run:

```bash
cd /team-XX/ece6765-project/evaluation
pixi run evaluate \
  --trace traces/short-query-answerable.jsonl \
  --output ../results/short-query-answerable.json
```

The harness handles launching your pipeline, waiting for `/health`, timing
the run, and scoring the output.

The evaluator writes the requested JSON report and prints a summary table.

### 4.1. Measurement discipline

 - **Characterize comparative variation.** Before claiming a configuration
   improvement, establish the run-to-run noise.
 - **Vary the trace.** A configuration tuned to one trace can fail on
   another with a different mix of query lengths.
 - **Control the machine.** Another group's job is not running on your
   server, but your own stray processes might be. See the [Server and
   Measurement Guide](ece6765-server-guide.md) for a checklist.
 - **Change one thing.** If you change the protocol and core count in the
   same experiment, you have learned nothing about either.
