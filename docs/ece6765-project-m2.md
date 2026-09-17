Milestone 2: Profiling and Application-Level Optimization
==========================================================================

In Milestone 1 you instrumented the supplied baseline and measured where its
time goes. That told you which stage dominates, but not what limits it. In
this milestone, characterize your server and profile the pipeline against it
to find out, then use that evidence to choose and evaluate application-level
optimizations. The four directions below are all required; how far you take
each one, and what you conclude from it, is up to you.

System-level knobs -- NUMA placement, page size, core pinning, frequency --
are [Milestone 3](ece6765-project-m3.md). Keep them fixed here and record
their values.

**See the [course schedule](https://www.csl.cornell.edu/courses/ece6765/schedule.html)
or the [Canvas calendar](https://canvas.cornell.edu/calendar) for the
deadline.**

 - **Submitted by:** the group, one submission per group
 - **Submit via:** GitHub, as `m2.md` plus code in your `team-XX` repo

1. Goals
--------------------------------------------------------------------------

 - Characterize the hardware resources relevant to your pipeline.
 - Explain what limits the stages your M1 breakdown found dominant.
 - Evaluate each of the four application-level optimization directions.
 - Report the performance and answer-quality tradeoff each one makes.

2. What to Do
--------------------------------------------------------------------------

### 2.1. Draw a block diagram of your server

Before you profile anything, establish what the machine is. Produce a block
diagram of your server, annotated with the quantities that determine where
data moves and what limits it, together with the text needed to read it.
Measure what you can rather than quoting a datasheet, and mark clearly which
numbers you measured and which you took from documentation.

Cover at least:

 - **Sockets and cores** -- how many sockets, how many cores each, and the
   interconnect between them if there is more than one.
 - **Cache hierarchy** -- level sizes and which cores share each level.
 - **Memory** -- channels and capacity per socket, unloaded access latency,
   latency as offered load increases, and the peak bandwidth you can actually
   reach.
 - **NUMA** -- latency and bandwidth for local and remote access, for every
   node pair your machine exposes.
 - **I/O** -- PCIe generation and lane counts, which socket each link hangs
   off, and what is attached to it.

The loaded-latency behavior is the part groups most often skip and most often
need later: an idle-latency number alone will not explain a pipeline running
under load. State the tools you used and any quantity your hardware or your
permissions prevented you from measuring.

### 2.2. Place your pipeline phases on a roofline

Build a roofline model for one socket of your server, using **floating-point**
throughput as the compute ceiling. Both the vector database and the generation
model do their arithmetic in floating point, so that is the ceiling that binds
here; you do not need an integer roofline for now. Measure the
attainable compute and memory-bandwidth ceilings on your machine rather than
deriving them from published peak numbers alone, and say how you obtained
each.

Then measure the arithmetic intensity and achieved floating-point throughput
of each phase of your RAG pipeline separately -- embedding, vector search,
generation, and any other phase your decomposition exposes -- and plot each
phase as a point on that roofline. For every point, say whether the phase is
compute-bound or bandwidth-bound, how far below the relevant ceiling it sits,
and what you think accounts for the gap.

### 2.3. Identify the CPU bottleneck with top-down analysis

Apply the top-down methodology to each phase of the pipeline to determine what
limits the CPU while that phase runs. Start by attributing lost execution
capacity to a small number of top-level causes -- work actually retiring,
work thrown away by misspeculation, the frontend failing to supply the core,
and the backend failing to absorb what it is given -- and then drill into the
dominant cause as far as the counters on your hardware allow. Report the
breakdown per phase, not one number for the whole pipeline: the phases stress
the core in different ways, and a single aggregate hides exactly the
difference you are looking for.

The published formulations of this analysis assume the counters of the core
they were written for, and yours are not those cores. Arm cores differ in
whether they account for issue slots at all; where slot accounting is absent,
the equivalent analysis is built from cycle-level stall counters and the
event groups your PMU does provide, and the resulting categories will not map
one-to-one onto the ones in the papers. Work out what your PMU supports
before you fit your data to someone else's category names, and report the
breakdown your hardware can actually justify.

The methodology is described in Yasin's paper, [A Top-Down Method for
Performance Analysis and Counters
Architecture](https://ieeexplore.ieee.org/document/6844459). For its
application on ARM cores, including the counter groups and the ordering of the
drill-down, see [Arm Neoverse V1 top-down
methodology](https://developer.arm.com/community/arm-community-blogs/b/servers-and-cloud-computing-blog/posts/arm-neoverse-v1-top-down-methodology),
which is an example of adapting it to an Arm core rather than a recipe for
yours. Consult the reference manual and telemetry guide for your own core for
the events it implements, and state plainly any category you could not
resolve and why.

See the [Server and Measurement Guide](ece6765-server-guide.md) for platform
notes and measurement hygiene.

Taking the three results together, state what limits each stage of your
pipeline, and relate that back to the time breakdown you reported in M1.

### 2.4. Explore optimizations

Explore all four directions below. For each one, report what it costs and
what it buys: the effect on throughput and completion latency, on answer
quality, and on resource use, measured against your M1 baseline. Use your
profile to decide how far to push each direction and which configurations are
worth exploring within it. Where your profile predicts that a direction will
not help, say so before you measure it, and then report whether the
measurement agreed. Additional application-level approaches are welcome on
top of these four if you justify and measure them.

 - **Quantize the model.** Explore lower-precision inference for the
   course-specified generation model. You may change the inference backend
   (for example, from [Transformers](https://huggingface.co/docs/transformers/index)
   to [vLLM](https://github.com/vllm-project/vllm),
   [SGLang](https://github.com/sgl-project/sglang), or
   [llama.cpp](https://github.com/ggml-org/llama.cpp)). Measure performance and
   answer quality, and distinguish the effects of a backend change from
   those of quantization.
 - **Use a supplied chunked database.** Staff will provide two variants of
   the existing CLAPNQ corpus: 128-token chunks with 64-token overlap, and
   64-token chunks with 32-token overlap. Replace the baseline database with
   either variant and investigate the effects on retrieval, generation,
   memory use, and answer quality. Record which variant you use.
 - **Explore approximate nearest-neighbor search (ANNS).** Compare search
   algorithms and configurations against exact search. Investigate the
   tradeoffs among retrieval performance, memory use, and answer quality.
 - **Experiment with data parallelism.** Explore processing independent
   requests across model replicas or parallel database workers. Explain how
   concurrency and resource sharing affect throughput, latency, and memory
   use. Preserve the [four service responsibilities](ece6765-project-arch.md#11-the-decomposition-is-fixed).

Keep the external API and course-specified models. Quantized versions of the
same model and the staff-provided chunked corpus variants are permitted in
this milestone. Continue using the course evaluation workloads and report
answer quality alongside performance.

### 2.5. Measure and explain

Keep your M1 baseline runnable. Compare each change against it under the
same workload and machine conditions, isolating changes where possible.
Report throughput, completion latency, and answer-quality scores using the
[evaluation harness](ece6765-eval-harness.md), together with the measurements
needed to explain your results. Account for run-to-run variation.

If you combine changes, measure the combined configuration and explain any
interactions. Re-profile the resulting pipeline to establish whether its
bottleneck moved. A change that speeds up one phase may have little effect
on end-to-end performance; explain why. Report quality losses explicitly
rather than treating every speedup as an improvement.

Negative results are useful: a well-supported explanation of why an approach
did not help is a valid outcome.

3. What to Submit
--------------------------------------------------------------------------

Commit your implementation, configurations, and a file named `m2.md` at the
repo root containing:

 - [ ] **Title and group members**
 - [ ] **Server block diagram** -- annotated with the measured properties of
       the machine, with tools, measurement conditions, and limitations
 - [ ] **Roofline** -- the measured ceilings and each pipeline phase placed
       on them
 - [ ] **Top-down analysis** -- the top-level breakdown per pipeline phase,
       the counters it was built from, and what it says about the CPU
       bottleneck
 - [ ] **What limits each stage** -- the resource each stage runs out of, tied
       back to your M1 time breakdown, including anything that contradicts
       what the breakdown led you to expect
 - [ ] **Optimization experiments** -- all four directions: what you changed,
       which configurations you explored and why, and how to reproduce each
 - [ ] **Results and tradeoffs** -- for each direction, baseline comparisons
       of throughput, completion latency, answer quality, and relevant
       resource measurements, with the tradeoff each one makes stated
       explicitly; include negative results and interactions between
       combined changes
 - [ ] **Post-optimization profile** -- what now limits the pipeline
 - [ ] **Status and blockers**

Follow the [Report Guidelines](ece6765-report-guidelines.md). Include the
commands and configurations needed to reproduce your measurements.
