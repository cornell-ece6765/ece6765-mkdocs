Reference Architecture and API
==========================================================================

This page describes **what is fixed for the semester and what is yours to
change**, and it is important not to confuse them.

Three things are fixed for the semester. The first is the external interface:
the evaluation harness sends queries to your frontend with `POST /query`, and
your pipeline exposes a `/health` readiness check. A single evaluation harness
has to drive every group's pipeline, and comparable numbers across groups are
what make a class-wide discussion of results possible.

The second is the **four-service decomposition** -- `frontend`, `embedding`,
`vectordb`, and `generation`. You keep these four services, with these
responsibilities, throughout the semester. You may not merge them, split them, or
re-decompose the pipeline. 

The third is the **workload**: all groups use the course-specified embedding
model, generation model, and CLAPNQ dataset. These are fixed so that the
comparison is about systems rather than differences in models or data.

The released implementation is frozen for M1. Do not change its application
logic or configuration, or upgrade or replace released dependencies. You may
add instrumentation, observability dependencies and their lockfile entries,
and internal correlation metadata if they do not change its answers or
external API. Later milestone handouts state which implementation choices are
open for experimentation.

1. Services
--------------------------------------------------------------------------

Your pipeline is four services, running as separate processes. In M1 they
communicate over HTTP on localhost.

| Service | Baseline port | Responsibility |
|---------|-----:|----------------|
| `frontend` | 8000 | Accepts queries and orchestrates work across the other three services |
| `embedding` | 8001 | Encodes query text into a dense vector |
| `vectordb` | 8002 | Nearest-neighbor search over the passage index |
| `generation` | 8003 | Produces the answer text from query + retrieved passages |

The frontend is not just a proxy: it coordinates the other services and is
the natural place to implement scheduling policy when a milestone permits it.

### 1.1. The decomposition is fixed

**These four services, with these responsibilities, are a constraint for the
whole semester.** Unless explicitly mentioned that you are allowed, you may 
not fuse embedding into vectordb, split generation
into prefill and decode, absorb the frontend's scheduling into another
service, or otherwise re-cut the boundaries.

Replicate a service only when a milestone explicitly permits it. Replicas
must still present that service's interface.

2. The Fixed Evaluation Interface
--------------------------------------------------------------------------

The evaluation harness reads a **trace file** and submits its queries to the
frontend. This interface cannot change because one harness has to drive every
group's pipeline and produce comparable numbers.

### 2.1. The execution model

The trace file contains a set of requests that are **all available at time
zero**. There is no arrival process and no request rate.

This models a real situation in a datacenter: a scheduler upstream has
already assigned a batch of work to this server, and the server has a full
queue in front of it from the moment it starts. Everything in the trace is
sitting there, waiting, at t=0.

The released frontend processes queries sequentially in input order. For each
query it calls embedding, vector search, and generation before moving to the
next query.

### 2.2. Trace file format

The format is newline-delimited JSON, one request per line:

```json
{"id": "q-00001", "text": "who is the prime minister of Japan in August 2026?"}
{"id": "q-00002", "text": "What was the average temperature in Ithaca in August 2026?"}
```

 - `id` is an opaque unique string. Results must carry it back unchanged, so
   answers can be attributed to requests.
 - `text` is the raw query. Public reference answers are not included in the
   request sent to the pipeline.
 - Each public trace contains 100 requests.

The pipeline API must continue to accept arbitrary unseen IDs and query text;
the public evaluator's trace validation does not narrow that interface.

### 2.3. Invocation

From the `evaluation/` directory, run:

```bash
pixi run evaluate \
  --trace traces/short-query-answerable.jsonl \
  --output ../results/short-query-answerable.json
```

The evaluator launches the pipeline, waits for `/health`, submits
the workload through `POST /query`, scores the response, and writes a report.
Use `--output <results-path>` to choose the report path.

### 2.4. Query API

The harness sends a JSON request to `POST /query`:

```json
{"queries":[{"id":"query-id","text":"question text"}]}
```

The frontend returns:

```json
{"responses":[{"id":"query-id","answer":"answer text","start_time_ms":0.0,"last_token_ms":100.0}]}
```

`queries` must be nonempty, IDs must be unique, and every requested ID must
appear exactly once in `responses`. Response order does not matter. Both
timestamps are nonnegative milliseconds from a common origin at the start of
frontend processing for the `/query` request. `start_time_ms` is recorded
immediately before that query's embedding call. `last_token_ms` is recorded
immediately after its blocking generation call returns, and it must not
precede `start_time_ms`.

The frontend reports these per-query timestamps. The evaluator separately
measures the complete HTTP request to calculate throughput.

### 2.5. Readiness

Your pipeline must expose `GET /health`, returning HTTP 200 with
`{"status":"ok"}` only once **every** component is ready to serve. When
reachable but not ready, the released frontend returns HTTP 503 with
`{"status":"unavailable"}`. The harness polls this before starting the timed
run, so that model loading and index construction do not land inside your
measured time.

How you aggregate readiness across however many processes you end up with is
your problem. Reporting healthy before you actually are will show up as
inexplicably terrible numbers, because that work moves inside the clock.

3. Internal interfaces: the semester's experiment
--------------------------------------------------------------------------

The decomposition is fixed. The released internal protocol is also fixed for
M1; later handouts state when these choices become experimental.

The **semantics** of each hop remain fixed -- which service needs what data
from which other service:

 - the frontend needs a **vector** for a query from `embedding`
 - the frontend needs **passages** for a vector from `vectordb`
 - the frontend needs an **answer** for a query plus passages from
   `generation`

How that data crosses the boundary may become part of the later design space:
the wire format, transport, framing, initiator, and whether the call blocks.

The reference implementation wires the services together with **plain HTTP
and JSON bodies**. It is intentionally naive and serves as the common released
baseline.

```
frontend ──POST /embed────────▶ embedding    {"texts": [...]}  →  {"vectors": [[...]]}
frontend ──POST /search───────▶ vectordb     {"vectors": [[...]], "k": N}
                                             →  {"passages": [[...]]}
frontend ──POST /generate─────▶ generation   {"query": "...", "passages": [...]}
                                             →  {"answer": "..."}
```

Starting in M2, follow the active milestone's instructions about which protocol
axes you may change and measure.

4. Repository layout
--------------------------------------------------------------------------

Your private repository is named `team-XX` and its canonical checkout is
`/team-XX/ece6765-project/`. Milestone writeups are collected automatically,
so **the four `mN.md` files must sit at the repository root with exactly those
names**.

```
/team-XX/
  embeddings.npy             provided artifact; do not commit
  ece6765-project/
    README.md                 project description + group members
    m1.md  m2.md  m3.md  m4.md
    img/                      figures referenced from the writeups
    results/                  small summarized result files
    template/                 pipeline source and launch scripts
    evaluation/               course-provided evaluator; do not modify
```

`results/` should hold summarized numbers, not raw traces. See the [Git
Workflow](ece6765-git-workflow.md) page for size limits.

5. Reproducibility requirement
--------------------------------------------------------------------------

From M1 onward, your repository must document the exact commands that bring up
the entire pipeline from `/team-XX/ece6765-project/` and run the harness
against it. The staff will run these. If your pipeline only comes up when a
specific group member types a specific sequence of commands from memory, it
does not count as working, and it means your final results cannot be
reproduced.
