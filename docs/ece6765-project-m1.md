Milestone 1: RAG Pipeline Implementation
==========================================================================

In this milestone you build the application you will spend the rest of the
semester optimizing: a four-service RAG pipeline that answers queries
correctly. Performance is explicitly **not** the goal here. A correct,
clean, well-instrumented baseline is.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/index.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m1.md` plus code in your `project-gNN` repo
 - **Weight:** _TBD_ of the project grade

1. Goals
--------------------------------------------------------------------------

By the end of this milestone your group should have:

 - A working pipeline that embeds a query, retrieves passages, and generates
   an answer. The [reference structure](ece6765-project-arch.md) is four
   services over HTTP; adopting it is the fast path, and departing from it is
   allowed if you can justify the departure.
 - A `POST /query` endpoint conforming to the [API
   contract](ece6765-project-arch.md), returning answers attributed by `id`.
 - A passing score on the correctness mode of the [evaluation
   harness](ece6765-eval-harness.md).
 - A one-command launch script that brings the whole pipeline up on a clean
   server.
 - A **baseline measurement** of TTFT, total generation time, and tail
   latency, with variation reported across repeated runs.
 - A first hypothesis, backed by a rough measurement, about where the time
   goes.

2. What to Build
--------------------------------------------------------------------------

!!! note "Requirements, not instructions"

    What follows describes **what must exist** at the end of this milestone.
    It does not prescribe how to build it. Language, frameworks, libraries,
    process structure, and serving strategy are yours to choose and yours to
    justify.

    The subsections below follow the [reference
    structure](ece6765-project-arch.md) -- four services over HTTP -- because
    it is a reasonable place to start and it gives the rest of the handouts a
    shared vocabulary. **You are not required to adopt it.** If you have a
    reason to decompose the pipeline differently, do that instead and explain
    why in your writeup. The only hard requirement is the `POST /query` and
    `/health` contract.

    Most groups should take the reference structure in M1 anyway -- not
    because it is mandated, but because M1 is where you find out how much of
    your semester the toolchain intends to consume, and that is a bad week to
    also be inventing an architecture. You can re-decompose in M2 with
    measurements telling you where to cut.


### 2.1. Get access and read the contract

Claim your server (see the [Server and Measurement
Guide](ece6765-server-guide.md)), clone your group repo (see the [Git
Workflow](ece6765-git-workflow.md)), and read the [Reference Architecture
and API](ece6765-project-arch.md) page carefully. The external interface is
fixed; building something that almost matches it means the harness cannot
grade you.

### 2.2. Build the embedding service

Wrap
[`jinaai/jina-embeddings-v5-text-nano`](https://huggingface.co/jinaai/jina-embeddings-v5-text-nano)
behind a `POST /embed` endpoint that takes a list of texts and returns a
list of vectors. The model is fixed for all groups.

Note that the endpoint takes a *list* even though the reference
implementation will only ever pass one element. Design the interface for
batching now even though you are not using it yet -- retrofitting a batch
dimension through a service that assumed one input is unpleasant.

### 2.3. Build the vector DB service

Index the ClapNQ passage corpus and expose `POST /search`, taking query
vectors and a `k`, returning the top-`k` passages.

You may use an existing vector index library or write your own. Both are
legitimate, and they lead to different projects: an off-the-shelf index gets
you to a baseline faster, while your own gives you more to optimize later.
Whichever you choose, record in your writeup **which index algorithm and
parameters** you used, since exact versus approximate search is a
correctness/performance tradeoff you will revisit.

Index construction happens before the timed run and is not measured -- but
it does need to happen inside your launch script, and the harness will not
start timing until `/health` reports ready.

### 2.4. Build the generation service

Wrap the course-specified generation model (_TBD -- announced before this
milestone is released_) behind `POST /generate`, taking a query and its
retrieved passages and returning answer text.

This service must support streaming output, since the harness measures time
to first token. Getting streaming right in M1 is much easier than bolting it
on in M3.

### 2.5. Build the frontend

Orchestrate the other three: for each query, embed it, search with the
resulting vector, generate from the query plus retrieved passages, and
return the answer tagged with its original `id`.

Batch size 1, sequential, plain HTTP. Resist the urge to optimize. You need
a baseline that is obviously correct and obviously naive, because every
number you report for the rest of the semester is a comparison against it.

Do put the inter-service calls behind a client interface -- one small class
per service -- rather than scattering HTTP calls through the orchestration
logic. M2 asks you to change the transport, and this decision is the
difference between an afternoon and a week.

### 2.6. Instrument it

Add timing instrumentation at each service boundary now: how long each
service took per request, and how long the frontend spent waiting on each.
You do not need anything sophisticated -- timestamps and a structured log
line are enough -- but you need it before you can answer Section 2.8.

### 2.7. Establish the baseline

Run the harness. Confirm you pass correctness, then measure:

 - Time to first token (p50, p95, p99, max)
 - Total generation time and queries per second
 - End-to-end tail latency (p50, p95, p99, p99.9, max)

Repeat the run enough times to report variation, discard warmup, and follow
the measurement discipline in the [harness
guide](ece6765-eval-harness.md#41-measurement-discipline).

### 2.8. Form a hypothesis

Using your instrumentation, produce a breakdown of where wall-clock time
goes across the stages of your pipeline and the hops between them. Then
answer, in prose: **which stage is the bottleneck, and what evidence
supports that?**

You are not expected to be right. You are expected to have a defensible
first answer and to know what measurement would confirm or refute it. M2
will test it.

3. What to Submit
--------------------------------------------------------------------------

Commit working code to your repository and a file named `m1.md` at the repo
root containing:

 - [ ] **Title and group members** -- project title, all three names and
       NetIDs
 - [ ] **Implementation overview** (~1 page) -- what each service does, what
       libraries and index algorithm you chose, and why
 - [ ] **How to run it** -- the exact commands to bring up the pipeline and
       run the harness on a clean server
 - [ ] **Correctness result** -- your harness correctness score and
       confirmation that you clear the threshold
 - [ ] **Baseline measurements** (~1 page) -- the three metric families, as
       distributions, with number of runs and observed variation
 - [ ] **Time breakdown** -- a figure showing where wall-clock time goes
       across services and hops
 - [ ] **Bottleneck hypothesis** (~2 paragraphs) -- which service you believe
       is the bottleneck, the evidence, and the experiment that would confirm
       it
 - [ ] **Division of labor** -- who owns which service going forward
 - [ ] **Status and blockers** -- what is not working and what you are stuck
       on

Figures go in `img/`; result summaries go in `results/`.

```bash
% cd ${HOME}/ece6765/project-gNN
% git add m1.md img/ results/ src/ scripts/
% git commit -m "Milestone 1 submission"
% git push
```

The submission is the last commit on `main` at or before the deadline.

4. Grading Rubric
--------------------------------------------------------------------------

| Criterion | Weight | What we are looking for |
|-----------|--------|-------------------------|
| Correctness | _TBD_ | Pipeline clears the harness quality threshold |
| API conformance | _TBD_ | `POST /query` and `/health` match the contract exactly |
| Reproducibility | _TBD_ | Staff can bring up your pipeline and run the harness from your documented commands, unaided |
| Baseline measurement quality | _TBD_ | Distributions not point values; repetitions reported; warmup handled |
| Time breakdown and hypothesis | _TBD_ | Instrumentation supports the claim; hypothesis is specific and testable |
| Writeup | _TBD_ | Clear, correctly labeled figures, claims matching evidence |

Feedback will be pushed to your group repository as
`m1-feedback-<DATE>.md` after the deadline.

5. Tips
--------------------------------------------------------------------------

These are offered as engineering judgment from past performance projects.
None of them are requirements.

!!! tip "Budget for friction, not just for coding"

    The dominant cost in M1 is rarely writing the services. It is dependency
    hell, ARM64 wheels that do not exist, models that will not load, and
    services that will not stay up. This is normal, it is the work, and no
    one is going to clear it for you. Start early enough that a lost week
    does not sink the milestone.


!!! tip "Correctness first, and keep checking it"

    Run the harness in correctness mode after every substantive change. Most
    of what you do in later milestones can silently degrade answer quality,
    and the earlier you build the habit the less rework you do.

!!! tip "Do not optimize in M1"

    Groups that arrive at M2 with an already-tuned pipeline have no baseline
    to compare against and consistently write weaker reports. The naive
    version is an asset. Tag the commit.

!!! tip "Streaming is easier to design in than to add"

    TTFT is one of three headline metrics. A generation service that
    materializes the full answer before returning it will need restructuring
    later; doing it as a stream from the start costs almost nothing now.

!!! tip "Watch the vector serialization"

    The `embedding → vectordb` hop moves full dense vectors as JSON arrays
    of floats. You are not asked to fix this in M1 -- but instrument it, so
    that when you do fix it in M2 you can quantify what it cost.
