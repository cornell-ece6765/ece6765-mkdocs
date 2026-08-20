Reference Architecture and API
==========================================================================

This page describes **one fixed contract and one suggested starting
structure**, and it is important not to confuse them.

The **fixed part** is the external interface in Section 2: your pipeline
consumes a **trace file** of requests and writes a results file with answers
and per-request timings. A single evaluation harness has to drive every
group's pipeline, and because comparable numbers across groups make a
class-wide discussion of results possible. That interface, plus a `/health`
readiness check, is what cannot change. That is the whole of what is
fixed.

The **suggested part** is everything else on this page: the four-service
decomposition, the internal endpoints, the transport, the repository layout.
That is a reference structure we provide so you have somewhere to start, not
a specification you must conform to. **You may change any of it, including
the decomposition itself**, at any point in the semester.

Read this before starting [Milestone 1](ece6765-project-m1.md).

1. Services
--------------------------------------------------------------------------

The reference structure is four services, running as separate processes and
communicating over HTTP on localhost.

| Service | Responsibility | Dominant resource |
|---------|----------------|-------------------|
| `frontend` | Loads the trace, schedules and orchestrates work across the other three, writes results | Scheduling / request overhead |
| `embedding` | Encodes query text into a dense vector | CPU, SIMD, cache |
| `vectordb` | Nearest-neighbor search over the passage index | Memory capacity and bandwidth |
| `generation` | Produces the answer text from query + retrieved passages | Memory bandwidth, sequential compute |

Note that under the trace-driven model the frontend's job is larger than it
looks. It is not just a proxy: it is the **scheduler** for the whole
workload, and it owns the decision of what order several thousand queued
requests get executed in. That decision is worth more than most of the
micro-optimizations you will make.

They are split this way because they scale differently. Embedding and
vector DB in particular look adjacent but are not: one is compute-bound over
a tiny working set, the other is memory-bound over a large one. Splitting
them lets you provision each independently, at the cost of a serialization
hop between them.

That is a tradeoff, not a law -- and you are free to make it differently.

### 1.1. Changing the decomposition

You may merge services, split them further, or re-decompose the pipeline
entirely. Some things groups might reasonably try:

 - **Fusing embedding and vectordb** to eliminate the hop that serializes
   full dense vectors -- at the cost of no longer being able to scale
   compute and memory independently.
 - **Splitting generation** into prefill and decode, which have quite
   different resource profiles.
 - **Splitting the frontend** into request admission and orchestration.
 - **Replicating one service** many times behind the others while leaving
   the rest singular.

!!! note "Re-decomposition is a design decision, so justify and measure it"

    Changing the structure is allowed and can be a strong result. It is not
    a free win, and it is not exempt from the standard the rest of the
    project is held to: if you fuse two services, show what it bought you and
    what it cost, measured against the version that did not. "We merged them
    and it got faster" is not a finding. "We merged them, which removed 40%
    of frontend CPU spent in serialization but cost us the ability to scale
    the index independently, net X" is.

    One caveat worth thinking about before you fuse anything: the structure
    you end up with is also the structure you have to *reason about*. Groups
    that collapse the pipeline early often find that their profiling gets
    harder, because the boundaries where they used to measure are gone.

2. The Fixed Interface: Trace In, Results Out
--------------------------------------------------------------------------

Your pipeline is driven by a **trace file**. This is the one part of the
contract that cannot change, because a single evaluation harness has to
drive every group's pipeline and produce numbers that mean the same thing
across the class.

### 2.1. The execution model

The trace file contains a set of requests that are **all available to your
pipeline at time zero**. There is no arrival process and no request rate.

This models a real situation in a datacenter: a scheduler upstream has
already assigned a batch of work to this server, and the server has a full
queue in front of it from the moment it starts. Everything in the trace is
sitting there, waiting, at t=0.

The consequence is worth stating plainly, because it drives most of the
design decisions in this project: **you have complete freedom over execution
order.** Nothing forces you to process requests in trace order, one at a
time, or as they appear. You may reorder, group, batch, and schedule the
entire workload however you like. How you use that freedom is most of what
separates a fast pipeline from a slow one.

### 2.2. Trace file format

_Exact schema TBD -- fixed before M1 is released._ The working format is
newline-delimited JSON, one request per line:

```json
{"id": "q-00001", "text": "what is the capital of australia"}
{"id": "q-00002", "text": "who wrote the tell tale heart"}
```

 - `id` is an opaque unique string. Results must carry it back unchanged, so
   answers can be attributed to requests.
 - `text` is the raw query.
 - Traces range from a handful of requests to several thousand. **Do not
   assume a bound**, and do not assume the whole trace fits comfortably
   anywhere you might want to put it.

### 2.3. Invocation

The harness starts your pipeline, waits for it to report ready, and then
starts the timed run by handing it a trace path and an output path:

```bash
% ./scripts/run.sh --trace <trace-path> --output <results-path>
```

_Exact invocation TBD._ The timer starts (t=0) when the harness issues this
command, and stops when your process exits having written the results file.

Everything expensive that can happen before t=0 should happen before t=0:
loading models, building or memory-mapping the index, spawning workers,
opening connections. That is what `/health` is for -- see Section 2.5.
Reading and parsing the trace itself happens **after** t=0 and is on your
clock.

### 2.4. Results file

One record per request. _Exact schema TBD._

```json
{"id": "q-00001", "answer": "Canberra is ...", "first_token_ms": 412.7, "last_token_ms": 1893.2}
```

 - `answer` -- the generated text, scored for quality by the harness.
 - `first_token_ms` -- milliseconds from **t=0** to the first token emitted
   for this request.
 - `last_token_ms` -- milliseconds from **t=0** to the last token emitted for
   this request.

Both timestamps are measured from the start of the run, **not** from when
your pipeline happened to start working on that request. A request your
scheduler leaves until the end has a large `last_token_ms`, and that is the
point: the number includes however long the request sat in your queue.

Every `id` in the trace must appear exactly once in the results. Order does
not matter; the harness matches on `id`.

!!! warning "You report your own timestamps, and they are checked"

    Per-request timing has to come from inside your pipeline -- the harness
    cannot see individual completions from outside. It does independently
    measure total wall-clock time for the run, and it will cross-check your
    reported numbers against it. Results whose self-reported timings are
    inconsistent with the externally observed wall clock are treated as a
    failed run, not as a fast one.

    Instrument this carefully and early. A pipeline that is genuinely fast
    but reports its own timing incorrectly scores the same as a slow one.

### 2.5. Readiness

Your pipeline must expose `GET /health` returning HTTP 200 only once
**every** component is ready to serve. The harness polls this before
starting the timed run, so that model loading and index construction do not
land inside your measured time.

How you aggregate readiness across however many processes you end up with is
your problem. Reporting healthy before you actually are will show up as
inexplicably terrible numbers, because that work moves inside the clock.

3. Internal interfaces (suggested)
--------------------------------------------------------------------------

The reference structure wires the services together with **plain HTTP and
JSON bodies**, one query at a time. This is intentionally the naive choice:
it is easy to get working in M1 and it leaves the obvious wins on the table
for M2.

```
frontend ──POST /embed────────▶ embedding    {"texts": [...]}  →  {"vectors": [[...]]}
frontend ──POST /search───────▶ vectordb     {"vectors": [[...]], "k": N}
                                             →  {"passages": [[...]]}
frontend ──POST /generate─────▶ generation   {"query": "...", "passages": [...]}
                                             →  {"answer": "..."}
```

You are free to replace any of this. Things groups typically end up
changing:

 - **Serialization.** JSON arrays of floats are an expensive way to move
   embedding vectors. The `embedding → vectordb` path is the obvious first
   casualty.
 - **Transport.** gRPC, raw sockets, shared memory, Unix domain sockets.
 - **Batching.** The reference implementation processes batch size 1 at
   every hop. Constructing batches at service boundaries is one of the
   largest available wins, and it trades throughput against tail latency in
   a way you should be able to quantify.
 - **Concurrency.** Where requests queue, how many in flight, how work is
   distributed across cores within a service.

!!! tip "Write the template so it can change"

    In M1 you are building the thing you will spend three more milestones
    modifying. Put the transport behind an interface now -- a client class
    per service with a single implementation -- so that swapping HTTP for
    gRPC in M2 is a new implementation rather than a rewrite. Groups that
    hard-code `requests.post(...)` calls throughout the frontend pay for it
    later.

4. Repository layout
--------------------------------------------------------------------------

Milestone writeups are collected automatically, so **the four `mN.md` files
must sit at the repo root with exactly those names**. The rest of the layout
below is a suggestion that will stop making sense the moment you change the
decomposition -- reorganize it as you like.

```
project-gNN/
  README.md              project description + group members
  m1.md  m2.md           milestone writeups (root level, exact names)
  m3.md  m4.md
  img/                   figures referenced from the writeups
  src/
    frontend/
    embedding/
    vectordb/
    generation/
    common/              shared client/transport code
  config/                configuration for each experiment you run
  scripts/               launch, sweep, and measurement scripts
  results/               small summarized result files (CSV/JSON)
  README-data.md         where large artifacts live, how to regenerate
```

`results/` should hold summarized numbers, not raw traces. See the [Git
Workflow](ece6765-git-workflow.md) page for size limits.

5. Reproducibility requirement
--------------------------------------------------------------------------

From M1 onward, your repository must contain a single documented command
that brings up your entire pipeline, whatever it consists of, on a clean
server:

```bash
% ./scripts/launch.sh
```

and a single command that runs the harness against them. The staff will run
these. If your pipeline only comes up when a specific group member types a
specific sequence of commands from memory, it does not count as working, and
it means your final results cannot be reproduced.
