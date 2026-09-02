
ECE 6765 Modern Datacenter Architecture
==========================================================================

**Public Course Website:**
<https://www.csl.cornell.edu/courses/ece6765/index.html>

This is the ECE 6765 Modern Datacenter Architecture documentation site. It
hosts the handouts for the semester-long course project. If you find any
bugs or errors in this documentation, please contact the instructor.

The Course Project
--------------------------------------------------------------------------

You will build a **retrieval-augmented generation pipeline as four
microservices** -- frontend, embedding, vector DB, and generation -- and
then spend the semester using it to find out how sensitive a real workload
is to the system underneath it.

Those four services stay fixed for the semester. What you change is
everything underneath and between them. 

The pipeline is the instrument, not the goal. What you are building is the
ability to change something about a machine and explain what happened.

The evaluation harness reads a trace whose requests are all available at
time zero and sends them to your frontend through `POST /query`.
Per-request latency includes queuing as well as processing.

Because the services have genuinely different resource profiles, the
interesting decisions are about communication, resource allocation, and
scheduling: for example, what protocol carries a dense vector between two
services and what that costs, how many cores each service gets, where its
memory lives, how requests are batched at each hop, what the interconnect
costs, etc. Those are datacenter architecture decisions, and this project
puts you on the other side of them.

!!! danger "This is an open-ended graduate project"

    The handouts here state **what** you must accomplish and what you must
    report. They do not tell you how. We will give you a working starter
    template, but it is a baseline rather than a solution. Debugging,
    implementation strategy, tool selection, and project execution are
    entirely yours, and they are graded work.

    You are assumed to be fluent with the Linux command line, comfortable
    using AI coding tools well, and solid on low-level systems and
    architecture. See [what kind of project this
    is](ece6765-project-overview.md#what-kind-of-project-this-is) before you
    commit to the course.

!!! info "Milestone handouts are released one at a time"

    Each milestone handout is published when that milestone opens, so that
    everyone is working from the same version of it. The pages below become
    links as they are released. Deadlines are on the [course
    schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html).

<div class="grid cards" markdown>

- **[Project Overview](ece6765-project-overview.md)**

    What the project is for, the architecture, groups, infrastructure, and
    how the work is graded. Start here.

- **Milestone 1** &middot; *not yet released*

    Build the four-service pipeline. Get it correct, instrument it, and
    establish a baseline.

- **Milestone 2** &middot; *not yet released*

    Profile with performance counters. Optimize batching, parallelism,
    communication, and algorithms.

- **Milestone 3** &middot; *not yet released*

    Measure sensitivity: NUMA, page size, core allocation, PCIe affinity,
    frequency, vector units, and contention from a noisy neighbor.

- **Milestone 4** &middot; *not yet released*

    Combine everything, measure it, and write the report that explains it.

</div>

Reference
--------------------------------------------------------------------------

 - **[Reference Architecture and API](ece6765-project-arch.md)** -- the
   service contract. Read before M1.
 - **[Evaluation Harness and Metrics](ece6765-eval-harness.md)** -- how
   correctness and performance are scored.
 - **[Server and Measurement Guide](ece6765-server-guide.md)** -- server
   access, profiling tools, measurement hygiene.
 - **[Project Report Guidelines](ece6765-report-guidelines.md)** -- writeup
   format and how to report measurements.
 - **[Git Workflow for Group Repos](ece6765-git-workflow.md)** -- repo setup
   and how submissions are collected.

!!! note "Deadlines"

    All milestone deadlines are on the [course
    schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html). 
