Milestone 2: Profiling and Application-Level Optimization
==========================================================================

In Milestone 1 you instrumented the supplied baseline and identified its
likely bottleneck. In this milestone, characterize your server and profile
the pipeline, then use that evidence to choose and evaluate application-level
optimizations. This is an open-ended investigation: you decide which
approaches are worth pursuing and explain what you learn.

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
 - Use profiling evidence to confirm or refute your M1 bottleneck hypothesis.
 - Choose and evaluate application-level optimizations based on that evidence.
 - Explain their effects on performance, resource use, and answer quality.

2. What to Do
--------------------------------------------------------------------------

### 2.1. Characterize and profile

Characterize your server and profile the baseline under load before making
changes. Describe the relevant hardware resources and show where time is
spent across the RAG pipeline. Use hardware performance counters to support
your explanation of the bottleneck; choose measurements that help test your
hypothesis rather than collecting every available counter.

Useful approaches include a hardware block diagram or roofline model,
memory bandwidth and latency measurements, core utilization, IPC, cache
misses per thousand instructions, instruction breakdown, and top-down
analysis. These are examples, not a required checklist. Use the counters
supported by your hardware and tools, and explain any measurement limitations.
See the [Server and Measurement Guide](ece6765-server-guide.md).

State whether the evidence confirms your M1 hypothesis. If it does not,
explain what changed your understanding.

### 2.2. Explore optimizations

Choose from the following directions based on your profile. You do not need
to pursue all four, and there is no required number of optimizations or
categories. Other application-level approaches are welcome if you justify
and measure them.

 - **Quantize the model.** Explore lower-precision inference for the
   course-specified generation model. You may change the inference backend
   (for example, from Transformers to llama.cpp). Measure performance and
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

### 2.3. Measure and explain

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
 - [ ] **Characterization and profiling** -- relevant server properties,
       tools, measurement conditions, baseline profile, and limitations
 - [ ] **Hypothesis outcome** -- whether your M1 diagnosis held up and why
 - [ ] **Optimization experiments** -- what you chose, why, what changed,
       and how to reproduce each configuration
 - [ ] **Results and explanation** -- baseline comparisons of throughput,
       completion latency, answer quality, and relevant resource measurements;
       include negative results and interactions between combined changes
 - [ ] **Post-optimization profile** -- what now limits the pipeline
 - [ ] **Status and blockers**

Follow the [Report Guidelines](ece6765-report-guidelines.md). Include the
commands and configurations needed to reproduce your measurements.
