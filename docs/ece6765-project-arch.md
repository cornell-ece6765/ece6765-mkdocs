Reference Architecture and API
==========================================================================

This page describes **one fixed contract and one suggested starting
structure**, and it is important not to confuse them.

The **fixed part** is the external interface in Section 2. Every group's
frontend must expose the same `POST /query` endpoint so that a single
evaluation harness can drive every pipeline and the contest results mean
something. That is the whole of what is fixed.

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
| `frontend` | Accepts client queries, orchestrates the other three, returns answers | Network / request overhead |
| `embedding` | Encodes query text into a dense vector | CPU, SIMD, cache |
| `vectordb` | Nearest-neighbor search over the passage index | Memory capacity and bandwidth |
| `generation` | Produces the answer text from query + retrieved passages | Memory bandwidth, sequential compute |

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

2. External API (the one fixed thing)
--------------------------------------------------------------------------

Your pipeline must expose a `POST /query` endpoint. This is the only
interface the evaluation harness touches, and its shape is fixed.

Note that this constrains the *interface*, not the *implementation*. Nothing
requires the thing serving `/query` to be called "frontend" or to be one of
four services -- only that the endpoint exists, speaks the schema below, and
is what your launch script brings up.

### 2.1. Request

The harness submits a batch of queries in a single request:

```json
{
  "queries": [
    { "id": "q-00001", "text": "what is the capital of australia" },
    { "id": "q-00002", "text": "who wrote the tell tale heart" }
  ]
}
```

 - `id` is an opaque unique string. It exists for attribution: your response
   must carry it back unchanged.
 - `text` is the raw query string.
 - The harness may submit anywhere from 1 to several thousand queries in one
   request. **Do not assume a bound.**

### 2.2. Response

```json
{
  "responses": [
    { "id": "q-00001", "answer": "Canberra is the capital of Australia ..." },
    { "id": "q-00002", "answer": "The Tell-Tale Heart was written by ..." }
  ]
}
```

 - Every submitted `id` must appear exactly once in the response.
 - Order does not matter -- the harness matches on `id`, not position.
 - `answer` is the generated text, scored for quality as described on the
   [Evaluation Harness and Metrics](ece6765-eval-harness.md) page.

### 2.3. Streaming

To let the harness measure **time to first token**, the frontend must also
support a streaming response mode. The exact wire format
(newline-delimited JSON over a chunked response, server-sent events, or
equivalent) is _TBD and will be fixed in the harness specification before M1
is released_.

### 2.4. Health endpoint

Your pipeline must expose `GET /health` alongside `/query`, returning HTTP
200 only once **every** component is ready to serve. The harness polls this
before starting a timed run, so that model loading and index construction do
not pollute your latency numbers.

How you aggregate readiness across however many processes you end up with is
your problem. Reporting healthy before you actually are will show up as
inexplicably terrible first-run numbers.

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
in M4 it means your contest entry cannot be reproduced.
