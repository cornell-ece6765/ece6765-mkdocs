Server and Measurement Guide
==========================================================================

Every group gets a dedicated Ampere server. This page covers access, the
tools available for profiling, and the measurement hygiene that makes your
numbers mean something.

!!! warning "Draft"

    Access details, hostnames, the reservation mechanism, and the exact
    tooling available are _TBD_ and will be filled in before Milestone 1 is
    released. The measurement discipline in Sections 3 and 4 is final.

1. Access
--------------------------------------------------------------------------

 - **Hostnames and accounts:** _TBD_
 - **Authentication:** _TBD_
 - **VPN requirement:** _TBD_
 - **Reservation / scheduling:** _TBD_

All groups have identical hardware. This is what makes the [contest](ece6765-project-m4.md)
fair and what lets you compare your numbers against the rest of the class.

!!! danger "The server is shared with your own group"

    Three people running timed experiments on one machine at the same time
    will produce three sets of meaningless numbers. Agree on a protocol
    within your group -- a shared calendar, a lock file, anything -- before
    you start measuring. This is the single most common source of
    unexplainable variance in this project.

2. Platform notes
--------------------------------------------------------------------------

The servers are **Ampere (ARM64)**. A few consequences worth knowing before
you start:

 - Python wheels and container images that "just work" on x86 sometimes do
   not have ARM64 builds. Check early; discovering this the night before M1
   is due is avoidable.
 - Performance counter names, SIMD instruction sets, and profiling tool
   support differ from x86. Guides you find online assume x86 more often
   than not.
 - Vector unit behavior, page size options, and NUMA topology are all
   platform-specific. Do not assume; check the machine.

Machine details -- core count, NUMA topology, cache hierarchy, memory
configuration, available page sizes, frequency range -- are _TBD_ and will
be documented here. You should also learn to query them yourself; your M3
sweeps depend on knowing the actual topology.

3. Profiling tools
--------------------------------------------------------------------------

_Exact tool availability and any required permissions: TBD._

You will need, at minimum, the ability to:

 - Sample hardware performance counters per process
 - Read cache and TLB miss rates at each level
 - Measure memory bandwidth consumption
 - Attribute stall cycles
 - Observe NUMA-local versus remote memory access
 - Control thread and memory placement

Counter access on some platforms requires elevated permissions or a sysctl
change. If a counter you need is unavailable, ask on the course discussion
board rather than working around it with a worse proxy.

4. Measurement hygiene
--------------------------------------------------------------------------

This section is not optional advice. Milestone rubrics grade it directly.

### 4.1. Before every timed run

 - [ ] No other group member is running anything on the machine
 - [ ] No leftover processes from your last run -- check, do not assume
 - [ ] Services report ready via `/health` before timing starts
 - [ ] Warmup pass completed and discarded
 - [ ] The machine state you intend to test is actually set (verify, do not
       trust that the script applied it)

### 4.2. Repetitions

Run each configuration multiple times and report the variation. The number
required per milestone is _TBD_, but the principle does not change: a single
run is an anecdote.

For system-level effects in [M3](ece6765-project-m3.md) this matters most --
many of those knobs produce effects of a few percent, which is the same
order as run-to-run noise. Before you claim a 3% improvement, establish what
your noise floor actually is by running the *same* configuration repeatedly.
Report that noise floor in your writeup.

### 4.3. Record the machine state

Every result needs the configuration it was produced under: core allocation,
NUMA policy, page size, frequency setting, batch sizes, service versions,
and the commit hash. Automate this -- have your sweep script write the state
into the results file alongside the numbers.

A result you cannot reproduce because you do not know what state produced it
is worse than no result, because you will trust it.

### 4.4. Warmup and steady state

First runs after service start are not representative: caches are cold,
allocators have not settled, JITs have not warmed, and page tables are being
built. Discard warmup explicitly and say that you did.

5. Scope of Staff Support
--------------------------------------------------------------------------

Course staff own the infrastructure. You own everything you build on it.

**Ask staff about**, and ask early:

 - Server access, accounts, and reservations
 - A machine that is broken, unreachable, or in a bad state
 - Performance counters or platform features that are unavailable or require
   permissions you do not have
 - The evaluation harness misbehaving, or ambiguity in what it measures
 - Genuine ambiguity in a milestone requirement
 - Anything that affects all groups equally

**Do not ask staff to**:

 - Debug your services, your build, or your dependency conflicts
 - Recommend a library, framework, or implementation strategy
 - Teach Linux, the toolchain, or the profiling tools
 - Confirm in advance that your approach will work

That second list is not staff being unhelpful. Working out which library to
use, why your service stalls at 200 concurrent requests, and how to measure
something the tools do not report directly **is the graded content of this
project**. Handing you those answers would be handing you the milestone.

You have the entire internet, the vendor documentation, the source code of
everything you depend on, the papers we read in class, and AI coding tools.
Use them. If you are stuck, the productive question to bring to the
discussion board is a specific technical one, posed to your classmates, with
what you have already tried.

!!! tip "Talk to other groups"

    Cross-group discussion of ideas, tools, and approaches is encouraged --
    only code, configurations, and measurement data are off limits. Someone
    else has probably already hit the ARM64 build problem you are hitting.

If you think you have broken the machine, say so immediately. Nobody is
penalized for breaking a server; groups lose weeks by hiding it.
