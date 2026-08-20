
ECE 6765 Modern Datacenter Architecture
==========================================================================

**Public Course Website:**
<https://www.csl.cornell.edu/courses/ece6765/index.html>

This is the ECE 6765 Modern Datacenter Architecture documentation site. It
hosts the handouts for the semester-long course project. If you find any
bugs or errors in this documentation, please contant the instructor.

The Course Project
--------------------------------------------------------------------------

You will build a **retrieval-augmented generation pipeline as four
microservices** -- frontend, embedding, vector DB, and generation -- and
then spend the semester making it fast. The application is fixed; the
engineering is yours.

Because the four services have genuinely different resource profiles, the
interesting decisions are all about allocation: how many cores each service
gets, where its memory lives, how requests are batched at each hop, and what
the interconnect between services costs. Those are datacenter architecture
decisions, and this project puts you on the other side of them.


!!! danger "This is an open-ended graduate project"

    The handouts here state **what** you must accomplish and what you must
    report. They do not tell you how. We will give you an starter code template, 
    but that is neither a solution nor a working application.  
    Debugging, implementation strategy, tool selection,
    and project execution are entirely yours.

    You are assumed to be fluent with the Linux command line, comfortable
    using AI coding tools well, and solid on low-level systems and
    architecture. See [what kind of project this
    is](ece6765-project-overview.md#what-kind-of-project-this-is) before you
    commit to the course.

<div class="grid cards" markdown>

- **[Project Overview](ece6765-project-overview.md)**

    Architecture, groups, infrastructure, the contest, and how the project is
    graded. Start here.

- **[Milestone 1](ece6765-project-m1.md)**

    Build the four-service pipeline. Get it correct, instrument it, and
    establish a baseline.

- **[Milestone 2](ece6765-project-m2.md)**

    Profile with performance counters. Optimize batching, parallelism,
    communication, and algorithms.

- **[Milestone 3](ece6765-project-m3.md)**

    Sweep the system: NUMA, page size, core allocation, PCIe affinity,
    frequency, vector units.

- **[Milestone 4](ece6765-project-m4.md)**

    Performance contest, final report, and presentation.

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
