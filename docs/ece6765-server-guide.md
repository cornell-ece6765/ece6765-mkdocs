Server and Measurement Guide
==========================================================================

Every group gets a dedicated server. This page covers access, the
tools available for profiling, and the measurement hygiene that makes your
numbers mean something.

!!! warning "Draft"

    The reservation mechanism and the exact tooling available are _TBD_ and
    will be filled in before Milestone 1 is released. 

1. Access
--------------------------------------------------------------------------

Each group has its own dedicated server. The hostname follows your group
number, zero-padded to two digits:

```
altra-<NN>.ece.cornell.edu        NN = 01 through 14
```

Log in over SSH with your NetID and your Cornell password:

```bash
ssh <netid>@altra-<NN>.ece.cornell.edu
```

So a student with NetID `ma2222` in group 1 would run:

```bash
ssh ma2222@altra-01.ece.cornell.edu
```

Whether the servers are reachable from off campus without the Cornell VPN
is _TBD_. If you do need it, set it up ahead of time rather than at a
deadline: see [CU VPN](https://it.cornell.edu/cuvpn) at IT@Cornell, which
has per-platform instructions for Windows, macOS, Linux, and mobile. It
requires the Cisco Secure Client and Two-Step Login, and a session expires
after 10 hours, so expect to reconnect during long experiments.

**If you cannot log in, contact the course staff immediately.** Do not wait
until the milestone deadline to discover you have no access. Before you
write to us, rule out the three things that account for nearly every failed
login:

 - Your **NetID** is spelled correctly.
 - The **hostname** is correct -- your group number, with the leading zero
   for groups 1 through 9, and the full `.ece.cornell.edu` suffix.
 - Your **password** is your Cornell password, typed correctly.

All groups have identical hardware, so your numbers are directly comparable
with the rest of the class. If another group measures something different
from you on the same knob, that difference is real and worth chasing down. 

!!! danger "The server is shared with your own group"

    Three people running timed experiments on one machine at the same time
    will produce three sets of meaningless numbers. Agree on a protocol
    within your group -- a shared calendar, a lock file, anything -- before
    you start measuring. This is the single most common source of
    unexplainable variance in this project.

2. The Server Is Not Storage
--------------------------------------------------------------------------

!!! danger "Nothing on the server is safe. Back up to git, constantly."

    **Do not treat your server as the home of your work.** These machines can
    go down at any time, without warning, and recovery is not guaranteed. In
    the worst case we may have to **reformat a server outright** -- and if
    that happens, everything on it is gone permanently.

    "Everything" is broader than you are probably thinking. You do not just
    lose your source code. You lose your environment, your installed
    dependencies, your tuning scripts, your config files, your sweep
    infrastructure, your collected results, and every undocumented tweak you
    made to get the machine into the state where your numbers were good.

    Nobody is coming to recover it. There is no backup of your server.

The rule that follows is simple: **the git repository is where your project
lives, and the server is a place you temporarily run it.** If a server were
wiped right now, you should be able to get a fresh one, clone your repo, run
your setup script, and be back where you were. 

### 2.1. What belongs in the repo

Everything needed to reconstruct your work, not just the parts that look
like source code:

 - [ ] **Source** for every component
 - [ ] **Environment setup** -- the script or manifest that installs
       dependencies and builds everything on a bare machine. "We ran some
       `pip install` commands in August" is not recoverable.
 - [ ] **Launch scripts** -- how the pipeline comes up, which you owe anyway
       under the [reproducibility
       requirement](ece6765-project-arch.md#5-reproducibility-requirement)
 - [ ] **Configuration** -- every machine-state setting you apply: core
       allocation, NUMA policy, page-size setup, frequency governor, and
       anything else you tuned. This is the part groups most often lose,
       because it lives in shell history rather than in a file.
 - [ ] **Sweep and measurement scripts**
 - [ ] **Results** -- your summarized numbers, committed as you collect them,
       not at the end of the milestone
 - [ ] **Notes** -- what you tried, what the machine state was, what you
       concluded

Large datasets and model weights are the exception: do not commit those.
Commit the script that fetches or regenerates them, and record where they
came from in `README-data.md`.

### 2.2. Commit and push often

Local commits do not protect you here -- an uncommitted working tree and a
committed-but-unpushed branch are both lost when the disk goes. **Push.**

A reasonable habit: push at the end of every working session, and always
before you start something risky. Changing kernel parameters, editing boot
configuration, adjusting huge-page reservations, or installing something
system-wide are all good moments to push first.

!!! tip "Configuration changes are the dangerous ones"

    Losing a day of code is annoying. Losing the exact machine configuration
    that produced last week's results is much worse, because the results in
    your report become unreproducible and you cannot honestly defend them.
    Treat machine state as a versioned artifact, not as something you set up
    once and remember.

### 2.3. Assume you will need to rebuild from scratch

Periodically prove that you can. Wipe a working directory, clone fresh from
your repo, run your setup and launch scripts, and confirm the pipeline comes
up. Groups that do this discover their undocumented dependencies on a
Tuesday afternoon, which is a much better time to discover them than the
week a milestone is due.

3. Platform notes
--------------------------------------------------------------------------

The servers are **Ampere (ARM64)**. A few consequences worth knowing before
you start:

 - Python wheels and container images that "just work" on x86 sometimes do
   not have ARM64 builds. 
 - Performance counter names, SIMD instruction sets, and profiling tool
   support differ from x86. Guides you find online assume x86 more often
   than not.
 - Vector unit behavior, page size options, and NUMA topology are all
   platform-specific. 

*Machine details* (core count, NUMA topology, cache hierarchy, memory
configuration, available page sizes, frequency range): You should also learn to query them yourself. 

4. Profiling tools
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

5. Measurement hygiene
--------------------------------------------------------------------------

This section is not optional advice. Milestone rubrics grade it directly.

### 5.1. Before every timed run

 - [ ] No other group member is running anything on the machine
 - [ ] No leftover processes from your last run -- check, do not assume
 - [ ] Services report ready via `/health` before timing starts
 - [ ] The machine state you intend to test is actually set (verify, do not
       trust that the script applied it)

### 5.2. Run-to-run variation

Characterize run-to-run variation before claiming a small improvement. For
system-level effects in the sensitivity study, many knobs produce effects
of the same order as measurement noise. Report that noise floor in your
writeup.

### 5.3. Record the machine state

Every result needs the configuration it was produced under: core allocation,
NUMA policy, page size, frequency setting, request-processing configuration,
service versions, and the commit hash. Automate this -- have your sweep
script write the state into the results file alongside the numbers.

A result you cannot reproduce because you do not know what state produced it
is worse than no result, because you will trust it.

6. Scope of Staff Support
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
