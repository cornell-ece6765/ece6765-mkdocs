Reference Architecture and API
==========================================================================

This page describes **what is fixed for the semester and what is yours to
change**, and it is important not to confuse them.

Two things are fixed. The first is the external interface: your pipeline
consumes a **trace file** of requests and writes a results file with answers
and per-request timings, and it exposes a `/health` readiness check. A single
evaluation harness has to drive every group's pipeline, and comparable
numbers across groups are what make a class-wide discussion of results
possible.

The second is the **four-service decomposition** -- `frontend`, `embedding`,
`vectordb`, and `generation`. You keep these four services, with these
responsibilities, from M1 through M4. You may not merge them, split them, or
re-decompose the pipeline. See Section 1.1.

What is open -- and what this project is actually about -- is **how those
four services talk to each other**. Transport, serialization, framing,
batching, concurrency, connection management: all of it is yours, and
changing it is the primary experimental axis of the semester. Everything
*inside* a service is yours too: languages, libraries, algorithms, threading,
memory layout.

1. Services
--------------------------------------------------------------------------

Your pipeline is four services, running as separate processes. In M1 they
communicate over HTTP on localhost; what they communicate over after that is
up to you.

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

That serialization hop is not an accident of the reference design. It is the
thing you will spend the semester attacking.

### 1.1. The decomposition is fixed

**These four services, with these responsibilities, are a constraint for the
whole semester.** You may not fuse embedding into vectordb, split generation
into prefill and decode, absorb the frontend's scheduling into another
service, or otherwise re-cut the boundaries.

Concretely, for the whole semester:

 - Each of the four services remains a **separately addressable service**
   that the other services reach through a defined interface.
 - Each keeps the responsibility given in the table above. Embedding encodes
   text; vectordb searches the index; generation produces answer text; the
   frontend loads the trace, schedules, and orchestrates.
 - Work does not migrate across a boundary to make the boundary cheaper. Do
   not, for example, move nearest-neighbor search into the embedding service
   to avoid shipping vectors.

You **may replicate** a service -- several instances of `embedding` behind
the frontend, a sharded `vectordb` -- because that is provisioning, not
re-decomposition, and the M3 scalability study depends on your being able to
do it. Replicas of a service still present that service's interface.

!!! note "Why we are constraining this"

    Fusing services is a real technique and in a different course it would be
    a legitimate answer. It is excluded here for two reasons.

    The first is that it is the wrong lesson for this project. Once two
    services are fused, the communication cost between them stops being a
    thing you can measure -- the boundary where you used to observe it is
    gone. This project is about what it costs to move data and coordinate
    work between components that are genuinely separate, which is the
    situation an actual datacenter operator is in. Deleting the boundary
    answers a question nobody asked you.

    The second is comparability. Four fixed services with fixed
    responsibilities mean that when the class compares results at the end of
    the semester, "the embedding service is memory-bound at batch size 64"
    means the same thing in every group's report. That is what makes a
    class-wide discussion possible.

    The freedom you might have spent on the decomposition is instead spent on
    the interface between the pieces, which is a considerably deeper design
    space than it first appears. See Section 3.

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

3. Internal interfaces: the semester's experiment
--------------------------------------------------------------------------

The decomposition is fixed; the way the four services communicate is not.
This section is the open one, and it is where the design work of this project
actually lives.

What is fixed here is only the **semantics** of each hop -- which service
needs what data from which other service:

 - the frontend needs a **vector** for a query from `embedding`
 - the frontend needs **passages** for a vector from `vectordb`
 - the frontend needs an **answer** for a query plus passages from
   `generation`

Everything about *how* that data crosses the boundary is yours: the wire
format, the transport, the framing, how many requests travel at once, who
initiates, and whether the call blocks.

The reference implementation wires the services together with **plain HTTP
and JSON bodies**, one query at a time. This is intentionally the naive
choice: it is easy to get working in M1, and it leaves the obvious wins on
the table for the rest of the semester.

```
frontend ──POST /embed────────▶ embedding    {"texts": [...]}  →  {"vectors": [[...]]}
frontend ──POST /search───────▶ vectordb     {"vectors": [[...]], "k": N}
                                             →  {"passages": [[...]]}
frontend ──POST /generate─────▶ generation   {"query": "...", "passages": [...]}
                                             →  {"answer": "..."}
```

**Replace any of it.** The axes available to you, roughly in the order
groups tend to find them:

 - **Serialization.** JSON arrays of floats are an expensive way to move
   embedding vectors. The `frontend ↔ embedding ↔ vectordb` path is the
   obvious first casualty. Binary encodings, protobuf/FlatBuffers, or a raw
   length-prefixed float buffer.
 - **Transport.** gRPC, raw TCP sockets, Unix domain sockets, shared memory
   rings for colocated services. Each has a different cost structure and a
   different failure mode.
 - **Batching.** The reference implementation processes batch size 1 at
   every hop. Constructing batches at service boundaries is one of the
   largest available wins, and it trades throughput against tail latency in
   a way you should be able to quantify.
 - **Concurrency and call structure.** Synchronous request/response versus
   pipelined or streaming calls; how many requests are in flight per hop;
   whether generation can begin before retrieval fully completes.
 - **Connection management.** Pooling, keep-alive, how many connections per
   service pair, and what happens to tail latency when the pool is too small.
 - **Data movement.** Whether passages are copied through the frontend at all
   or passed by reference, and who owns the buffer.

Note that these interact. A binary format that halves serialization cost may
change the batch size at which batching stops paying; a shared-memory ring
may make copies free but pin two services to the same NUMA node, which M3
will make you care about.

!!! tip "Write the template so the protocol can change"

    This matters more here than it would in a project where the structure was
    negotiable. The decomposition is fixed precisely so that the boundary
    stays a thing you can measure and swap -- so build the boundary as a
    seam from day one.

    Put the transport behind an interface in M1: a client class per service
    with a single implementation, so that swapping HTTP for gRPC later is a
    new implementation rather than a rewrite. Groups that hard-code
    `requests.post(...)` calls throughout the frontend pay for it every
    milestone after M1, and they pay most in M4 when they want to combine
    three protocol choices and cannot.

    Being able to select the protocol from a config file -- and therefore
    run the same trace across protocols back to back -- is worth the hour it
    costs you in M1.

4. Repository layout
--------------------------------------------------------------------------

Milestone writeups are collected automatically, so **the four `mN.md` files
must sit at the repo root with exactly those names**. Because the four
services are fixed, the `src/` layout below should stay recognizable all
semester; the rest is a suggestion you can reorganize as you like.

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
    common/              shared client/transport code -- one client class
                         per service, with a selectable protocol
                         implementation behind it
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
