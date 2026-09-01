Course Project Overview
==========================================================================

The ECE 6765 course project is a semester-long study of **system
sensitivity**, built around a single application: a **retrieval-augmented
generation (RAG) pipeline implemented as four microservices**. You build it
once, then spend the rest of the semester using it to find out how a real
workload responds to the machine underneath it.


What the project is for
--------------------------------------------------------------------------

The goal is to develop a working understanding of how application
performance responds to the system underneath it -- to be able to take a
real workload, change something about the machine, and explain what happened
and why. By the end of the semester you should be able to answer questions
like:

 - Which parts of this workload are sensitive to **CPU frequency**, and
   which are not? What does that tell you about what limits them?
 - What does **NUMA placement** cost when you get it wrong, and which
   component pays?
 - When does **page size** matter, and how would you have predicted it from
   a TLB miss rate?
 - What happens to a latency-sensitive component when something else on the
   machine starts contending for **shared cache and memory bandwidth**? How
   much of a "dedicated" server is actually dedicated?
 - How does performance scale with **cores per component**, and why does the
   end-to-end optimum differ from what the individual scaling curves
   predict?
 - What does the **interconnect between components** cost, and how does that
   change with placement?

These are sensitivity questions, and answering them is the substance of the
project. A group that measures carefully, finds that a knob does nothing,
and explains correctly why it does nothing has done the assignment. A group
that makes the pipeline fast without being able to account for any of it has
not.

Why this application
--------------------------------------------------------------------------

RAG serving is not only an extremely important application, it is also
a good instrument for these questions because it is not one
program with one bottleneck. It is a set of components with genuinely
different resource profiles chained together behind a single request:

 - **Embedding** is compute-bound and vectorizable -- sensitive to cores,
   SIMD width, and frequency.
 - **Vector DB** is memory-bound -- sensitive to capacity, bandwidth, NUMA
   locality, and page size.
 - **Generation** is bound by both compute and memory bandwidth.
 - **Frontend** is I/O-bound and sensitive to request ordering.


What kind of project this is
--------------------------------------------------------------------------

This is a graduate course, and this is a graduate project. It is open-ended
research and engineering work, not a guided lab.

Every milestone handout on this site states **what you must accomplish and
what you must report**. None of them tell you how.

You will be given a **starter code template**. It is not a solution and it
is not a working application -- it is a skeleton that shows the shape of the
interfaces. Making it into something that runs, and then something that runs 
well, is entirely on you. There is no step-by-step walkthrough or provided
debugging path.

Choosing an implementation strategy, finding out why your service deadlocks
under load, discovering that a library has no ARM64 build and deciding what
to do about it, and figuring out how to measure something the tooling does
not measure directly -- **all of that is the project.** It is not an
obstacle standing between you and the project.

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

Four services, driven by a trace file of requests:

```
                          ┌──────────────┐      ┌────────────┐
   trace file             │              │─────▶│ embedding  │
   all requests at t=0    │              │◀─────│            │
 ────────────────────────▶│              │      └────────────┘
                          │   frontend   │
                          │              │      ┌────────────┐
                          │   loads      │─────▶│ vector DB  │
   results file           │   schedules  │◀─────│            │
   answers + per-request  │   runs it    │      └────────────┘
   timings from t=0       │              │
 ◀────────────────────────│              │      ┌────────────┐
                          │              │─────▶│ generation │
                          │              │◀─────│            │
                          └──────────────┘      └────────────┘
```

Your pipeline is driven by a **trace file**: a set of requests that are all
available to it at time zero, with no arrival process. This models a server
that an upstream scheduler has already handed a full queue of work. Because
everything is available immediately, **the execution order is entirely
yours** -- and per-request latency is measured from t=0, so it includes
however long a request sat in your queue before you got to it.

The reference implementation uses **plain HTTP with JSON** between services,
**batch size 1**, and processes the trace in order. All three are
deliberate: they are the obvious things to optimize, and we want you to
measure the cost before you fix it.

!!! note "The four services are fixed"

    You keep these four services -- `frontend`, `embedding`, `vectordb`,
    `generation` -- with these functionalities throughout the semester.
    **Merging, splitting, or re-decomposing the pipeline is not permitted.**
    You may replicate a service, which is provisioning rather than
    re-decomposition.

    What you can change, is **the communication between
    them**: wire format, transport, framing, batching, concurrency,
    connection management. That is the open design space that we explore in this project. 

    The reason for the constraint is that service boundaries are often fixed at
    application development time, and are not something a performance engineer
    can change. See [the decomposition is
    fixed](ece6765-project-arch.md#11-the-decomposition-is-fixed).

The full contract -- endpoint shapes, request and response schemas, and what
is fixed versus open -- is on the [Reference Architecture and
API](ece6765-project-arch.md) page.


A note on the end of the semester
--------------------------------------------------------------------------

The last Milestone is currently planned to include a **performance contest**:
every group runs the same trace on identical servers and the results are
compared. 

!!! note "This may change"

    This is the first offering of this project. Milestones are released
    gradually, and the shape of Milestones will depend on how the earlier milestones
    actually go -- both for you and for the server cluster. 


Infrastructure
--------------------------------------------------------------------------

Each group is given access to a **dedicated Ampere server**. All groups get
identical hardware.

Models are fixed for all groups so that the comparison is about systems, not
about model optimization. 

Server accesses are covered
in the [Server and Measurement Guide](ece6765-server-guide.md).

!!! danger "Keep nothing of value only on the server"

    These machines can crash without warning, and in the worst case may need
    to be reformatted -- taking your code, environment, configuration, and
    results with them. There is no backup. Commit and push to your group
    repository constantly, and make sure the repo contains enough to rebuild
    the machine from scratch, not just your source files. See [The Server Is
    Not Storage](ece6765-server-guide.md#2-the-server-is-not-storage).

### Machine topology


| Property | Value |
|----------|-------|
| Packages (sockets) | 2 |
| NUMA nodes | 2 -- one per package, 16 GB each, 32 GB total |
| Cores | 160 -- 80 per package, one thread per core |
| L1 (per core) | 64 KB data + 64 KB instruction |
| L2 (per core) | 1 MB, private |
| Shared LLC | 32 MB SLC per socket |
| Storage | NVMe SSD |
| Network | 2 port 1Gbps Ethernet |


??? exercise "Verify this yourself"

    The table above is a summary of the published specification. Confirm it
    against the machine you are actually given, and pay attention to where the
    two disagree:

    ```bash
    % lscpu
    % lstopo --of txt
    % numactl --hardware
    ```

    Start with the cache hierarchy, because that is where the table and the
    machine disagree. Your tools will report L1 and a private L2 per core,
    and then **nothing else** -- no last-level cache at all. The table above
    says 32 MB.

    The table is right. Ampere Altra parts (Arm Neoverse N1 cores) have a
    **32 MB System Level Cache** that the OS does not expose through the
    usual interfaces. Its absence from `lscpu` and `lstopo` is an enumeration
    issue with Linux.

Groups
--------------------------------------------------------------------------

 - Groups are **three students**. 
 - Each group gets a private repository `project-gNN` in the
   [cornell-ece6765](https://github.com/cornell-ece6765) GitHub
   organization, with all members as collaborators. See the [Git
   Workflow](ece6765-git-workflow.md) page.
 - All members receive the same milestone scores, adjusted by a peer
   contribution assessment collected with each Milestone report.
 - Even though you might split the project tasks between each other,
   all the students within a group should be able to explain the code, 
   the results, and the take aways from the experiments. 

Grading criteria
--------------------------------------------------------------------------

Across the project, we are looking for:

**Methodology.** Are experiments controlled? Is the baseline fair? Do you
run enough repetitions to distinguish a real effect from noise?

**Explanation over tuning.** Can you explain *why* a configuration helped,
in terms of the architecture? 

**Rigor in reporting.** Distributions, not single numbers. Named confounds.
Honest negative results -- an optimization that did not work, clearly
diagnosed, earns full credit.

**Communication.** Readable figures, correct units, claims that match the
evidence.

Academic integrity
--------------------------------------------------------------------------

Collaboration within your group is unrestricted. Across groups, you may
discuss ideas and approaches but may **not** share code, configuration
files, tuning parameters, or measurement data. Comparing findings with
another group is useful and encouraged; adopting their configuration is not,
and it also defeats the purpose -- the point is to have measured it
yourself.

External libraries and open-source components are allowed and encouraged,
but must be cited in your writeups. AI coding tools are expected -- see the
[Report Guidelines](ece6765-report-guidelines.md#7-use-of-ai-assistants) for
what you remain accountable for and what must be disclosed.

The Cornell Code of Academic Integrity applies:
<https://theuniversityfaculty.cornell.edu/academic-integrity/>
