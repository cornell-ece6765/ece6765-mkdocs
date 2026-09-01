Reference Architecture and API
==========================================================================

This page describes **what is fixed for the semester and what is yours to
change**, and it is important not to confuse them.

Three things are fixed for the semester. The first is the external interface:
your pipeline
consumes a **trace file** of requests and writes a results file with answers
and per-request timings, and it exposes a `/health` readiness check. A single
evaluation harness has to drive every group's pipeline, and comparable
numbers across groups are what make a class-wide discussion of results
possible.

The second is the **four-service decomposition** -- `frontend`, `embedding`,
`vectordb`, and `generation`. You keep these four services, with these
responsibilities, throughout the semester. You may not merge them, split them, or
re-decompose the pipeline. 

The third is the **workload**: all groups use the course-specified embedding
model, generation model, and ClapNQ dataset. These are fixed so that the
comparison is about systems rather than differences in models or data.

M1 additionally fixes the baseline communication protocol: plain HTTP with
JSON, batch size 1, and requests processed in trace order. This is an M1-only
constraint; after M1, the communication protocol and scheduling policy are
part of the experimental design space.

What is open (and what this project is actually about) is **how those
four services talk to each other**. Transport, serialization, framing,
batching, concurrency, connection management: all of it is yours, and
changing it is one of the experimental axes of the semester. Everything
*inside* a service, except the fixed models and dataset, is yours too:
languages, libraries, algorithms, threading, memory layout.

1. Services
--------------------------------------------------------------------------

Your pipeline is four services, running as separate processes. In M1 they
communicate over HTTP on localhost; what they communicate over after that is
up to you.

| Service | Responsibility |
|---------|----------------|
| `frontend` | Loads the trace, schedules and orchestrates work across the other three, writes results |
| `embedding` | Encodes query text into a dense vector | 
| `vectordb` | Nearest-neighbor search over the passage index | 
| `generation` | Produces the answer text from query + retrieved passages | 

Note that under the trace-driven model the frontend's job is larger than it
looks. It is not just a proxy: it is the **scheduler** for the whole
workload, and it owns the decision of what order the queued
requests get executed in. You can start from a first-come-first-serve 
scheduling algorithm and try other scheduling algorithms later on.

### 1.1. The decomposition is fixed

**These four services, with these responsibilities, are a constraint for the
whole semester.** Unless explicitly mentioned that you are allowed, you may 
not fuse embedding into vectordb, split generation
into prefill and decode, absorb the frontend's scheduling into another
service, or otherwise re-cut the boundaries.

You **may replicate** a service -- several instances of `embedding` behind
the frontend, a sharded `vectordb` -- because that is provisioning, not
re-decomposition. In fact in some of the milestones you should do this to 
improve the scalability of the application. Note that replicas of a service 
still present that service's interface.

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

### 2.2. Trace file format

_Exact schema TBD -- fixed before M1 is released._ The working format is
newline-delimited JSON, one request per line:

```json
{"id": "q-00001", "Q": "who is the prime minister of Japan in August 2026?"}
{"id": "q-00002", "Q": "What was the average temperature in Ithaca in August 2026?"}
```

 - `id` is an opaque unique string. Results must carry it back unchanged, so
   answers can be attributed to requests.
 - `Q` is the raw query. Ground-truth answers are held by the evaluation
   harness and are not included in the trace given to the pipeline.
 - Traces range from a handful of requests to several thousand. 

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
opening connections. That is what `/health` is for.
Reading and parsing the trace itself happens **after** t=0 and is on your
clock.

### 2.4. Results file

One record per request. _Exact schema TBD._

```json
{"id": "q-00001", "answer": "Sanae Takaichi", "start_time_ms": 100.8, "last_token_ms": 1893.2}
```

 - `answer` -- the generated text, scored for quality by the harness.
 - `start_time_ms` -- milliseconds from **t=0** to when the request is 
   scheduled for execution by the frontend.
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

**Replace any of it.** Build this protocol in M1 because it is the fastest
thing to get correct, then start taking it apart in M2, where the axes open
to you -- serialization, transport, batching, call structure, connection
management, who owns the buffer -- are laid out, and where a measured
protocol change is a required deliverable.

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
