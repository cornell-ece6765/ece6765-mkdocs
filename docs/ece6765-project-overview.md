Course Project Overview
==========================================================================

The ECE 6765 course project is a semester-long performance engineering
study built around a single application: a **retrieval-augmented generation
(RAG) pipeline implemented as four microservices**. You build it once, then
spend the rest of the semester making it fast.


Why this application
--------------------------------------------------------------------------

RAG serving is a representative modern datacenter workload that you use 
every day. It is not one program with one bottleneck; it is a set of services 
with different resource profiles chained together, that makes it a very 
interesting workload to optimize at system level. In this project you are 
going to try the decisions datacenter architects make to run workloads faster. 

What kind of project this is
--------------------------------------------------------------------------

This is a graduate course, and this is a graduate project. It is open-ended
research and engineering work, not a guided lab.

Every milestone handout on this site states **what you must accomplish and
what you must report**. None of them tell you how. There is no starter
repository, no reference solution, no step-by-step walkthrough, and no
provided debugging path. Choosing an implementation strategy, finding out
why your service deadlocks under load, discovering that a library has no
ARM64 build and deciding what to do about it, and figuring out how to
measure something the tooling does not measure directly -- **all of that is
the project.** It is not an obstacle standing between you and the project.

!!! danger "The instructor and staff do not debug your code"

    Course staff support the **infrastructure**: server access, the
    evaluation harness, the fixed models, and the requirements themselves. If
    a server is broken or a handout is genuinely ambiguous, ask immediately.

    Course staff do **not** debug your services, fix your build, resolve your
    dependency conflicts, teach the Linux command line, or teach you the
    tooling. Those are prerequisites and they are graded work. "We could not
    get it working" is a result you will be asked to explain, not a reason
    for an extension.

### Assumed background

You are expected to arrive already fluent in the following. The course will
not teach them:

 - **Linux command line and systems administration.** Building software from
   source, reading and fixing build failures, managing processes and
   services, understanding what your machine is doing and why. You will live
   on a remote server for a semester.
 - **AI coding tools.** You are expected to use them, and to use them well.
   A four-service pipeline is a lot of code to write in a semester alongside
   the measurement work, and groups that hand-write everything will run out
   of time. Using these tools competently -- including knowing when their
   output is wrong -- is a professional skill this project assumes.
 - **Low-level systems and computer architecture.** ECE 4750 or equivalent
   is a prerequisite. You should be comfortable reasoning about caches,
   memory hierarchies, TLBs, coherence, and instruction-level behavior, and
   be prepared to read hardware documentation.
 - **Independent research.** Reading documentation, papers, mailing lists,
   and source code to answer your own questions. When a performance counter
   on an ARM64 server behaves unexpectedly, the answer is somewhere in the
   vendor documentation, and finding it is part of the project.

### What "open-ended" means for grading

Because execution is yours, the interesting variation between groups will be
in *approach*, not in whether you followed instructions correctly. This
shapes how the project is graded:

 - **There is no single right implementation.** Two groups can make opposite
   design choices and both score well, provided each can justify its choice
   with evidence.
 - **Novel approaches are rewarded.** If you find an implementation strategy
   that is not the obvious one and can show it works, that counts for more
   than a careful execution of the expected path.
 - **Dead ends count, when they are diagnosed.** An approach you pursued,
   measured, and abandoned for a stated reason is real work and is graded as
   such. The same dead end, unreported, is a gap in your report.
 - **You are responsible for scope.** Nobody will tell you that your plan is
   too ambitious for the time available. Estimating that yourself is part of
   the exercise.
   

Architecture
--------------------------------------------------------------------------

Four services, chained behind one HTTP endpoint:

```
                  ┌────────────┐
   POST /query    │            │   embed(text)      ┌────────────┐
 ────────────────▶│  frontend  │───────────────────▶│ embedding  │
                  │            │◀───────────────────│            │
   {id, answer}   │            │   vector[]         └────────────┘
 ◀────────────────│            │
                  │            │   search(vector)   ┌────────────┐
                  │            │───────────────────▶│ vector DB  │
                  │            │◀───────────────────│            │
                  │            │   passages[]       └────────────┘
                  │            │
                  │            │   generate(query,  ┌────────────┐
                  │            │      passages)     │ generation │
                  │            │───────────────────▶│            │
                  │            │◀───────────────────│            │
                  └────────────┘   answer text      └────────────┘
```

The reference implementation uses **plain HTTP with JSON** between services
and **batch size 1** end to end. Both are deliberate: they are the obvious
things to optimize, and we want you to measure the cost before you fix it.

!!! note "This structure is a starting point, not a specification"

    We provide the four-service decomposition so that you have somewhere to
    begin and so that the milestones have a shared vocabulary. **It is not a
    constraint.** You may merge services, split them, or re-decompose the
    pipeline entirely, at any point in the semester.

    Exactly one thing is fixed: the external `POST /query` and `/health`
    contract, because a single evaluation harness has to drive every group's
    pipeline for the contest to mean anything. Everything behind that
    interface -- process structure, transport, languages, libraries,
    scheduling -- is yours.

    Changing the structure is a design decision like any other, which means
    it is held to the same standard: justify it and measure it against what
    it replaced. See [changing the
    decomposition](ece6765-project-arch.md#11-changing-the-decomposition).

The full contract -- endpoint shapes, request and response schemas, and what
is fixed versus suggested -- is on the [Reference Architecture and
API](ece6765-project-arch.md) page. Read it before Milestone 1.

Milestones
--------------------------------------------------------------------------

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html) for all
deadlines.**

| Milestone | Focus | Deliverable | Weight |
|-----------|-------|-------------|--------|
| [M1](ece6765-project-m1.md) | RAG pipeline implementation | Working four-service pipeline, correctness passing, baseline numbers | _TBD_ |
| [M2](ece6765-project-m2.md) | Profiling and application-level optimization | Performance-counter analysis, batching, parallelism, communication stack | _TBD_ |
| [M3](ece6765-project-m3.md) | System-level configuration study | Memory, network, scalability, and processor configuration sweeps | _TBD_ |
| [M4](ece6765-project-m4.md) | Performance contest and final report | Contest submission plus a full writeup | _TBD_ |

Each milestone builds on the previous one in the same repository. There is
no reset -- the code you write in M1 is the code you are still optimizing in
M4.

The performance contest
--------------------------------------------------------------------------

The semester ends with a **performance engineering contest**. Every group
runs the same evaluation harness against the same query set on identical,
dedicated servers. Your submission is ranked on the harness metrics defined
on the [Evaluation Harness and Metrics](ece6765-eval-harness.md) page.

!!! danger "Correctness gates the contest"

    A fast pipeline that returns wrong answers scores zero. Your submission
    must clear the answer-quality threshold on the held-out query set before
    its performance numbers count for anything. We will also run a query set
    you have not seen, so tuning that only works on the public queries will
    not survive.

Contest standing is part of the M4 grade, but it is not the whole grade,
and it is not winner-take-all. A group that finishes mid-pack with a sharp,
honest analysis of *why* their pipeline behaves the way it does will
outscore a group that wins with an unexplained pile of tuning flags.

Infrastructure
--------------------------------------------------------------------------

Each group is given access to a **dedicated Ampere server**. All groups get
identical hardware, which is what makes the contest meaningful and what
makes your measurements comparable to everyone else's.

Models are fixed for all groups so that the comparison is about systems, not
about who found a smaller model:

 - **Embedding:** [`jinaai/jina-embeddings-v5-text-nano`](https://huggingface.co/jinaai/jina-embeddings-v5-text-nano)
 - **Generation:** _TBD -- announced before M1 is released_

Server access, the reservation system, and measurement hygiene are covered
in the [Server and Measurement Guide](ece6765-server-guide.md).

Groups
--------------------------------------------------------------------------

 - Groups are **three students**. Groups of two require instructor approval;
   groups of four are not allowed.
 - You form your own groups. A partner-matching thread will be posted on the
   course discussion board.
 - Each group gets a private repository `project-gNN` in the
   [cornell-ece6765](https://github.com/cornell-ece6765) GitHub
   organization, with all members as collaborators. See the [Git
   Workflow](ece6765-git-workflow.md) page.
 - All members receive the same milestone scores, adjusted by a peer
   contribution assessment collected with M4.

!!! tip "Divide by service, not by milestone"

    The most effective split in past performance-engineering projects is by
    service -- each member owns one or two services across the whole
    semester and becomes the group's expert on that bottleneck. Splitting by
    milestone ("you do M2, I'll do M3") means nobody understands the system
    end to end when the contest arrives.

Grading criteria
--------------------------------------------------------------------------

Each milestone has its own rubric, published with its handout. Across the
project, we are looking for:

**Methodology.** Are experiments controlled? Is the baseline fair? Do you
run enough repetitions to distinguish a real effect from noise?

**Explanation over tuning.** Can you explain *why* a configuration helped,
in terms of the architecture? A 20% speedup you can attribute to a specific
counter is worth more than a 40% speedup you found by grid search and cannot
account for.

**Rigor in reporting.** Distributions, not single numbers. Named confounds.
Honest negative results -- an optimization that did not work, clearly
diagnosed, earns full credit.

**Communication.** Readable figures, correct units, claims that match the
evidence.

Academic integrity
--------------------------------------------------------------------------

Collaboration within your group is unrestricted. Across groups, you may
discuss ideas and approaches but may **not** share code, configuration
files, tuning parameters, or measurement data. The contest makes this
temptation real; treat cross-group code sharing as what it is.

External libraries and open-source components are allowed and encouraged,
but must be cited in your writeups. AI coding tools are expected -- see the
[Report Guidelines](ece6765-report-guidelines.md#7-use-of-ai-assistants) for
what you remain accountable for and what must be disclosed.

The Cornell Code of Academic Integrity applies:
<https://theuniversityfaculty.cornell.edu/academic-integrity/>
