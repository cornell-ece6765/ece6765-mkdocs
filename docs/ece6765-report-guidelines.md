Project Report Guidelines
==========================================================================

These conventions apply to every written milestone deliverable. They exist
so that your reports read like the papers we discuss in class, and so that
the staff can compare submissions fairly.

1. Format
--------------------------------------------------------------------------

 - Milestone submissions are **Markdown** files (`mN.md`) committed to your
   group repository. Do not submit PDFs, Word documents, or Google Docs
   links.
 - Use ATX headings (`##`, `###`) and keep the hierarchy shallow -- two
   levels is almost always enough.
 - Wrap prose at a reasonable column width. Long single-line paragraphs
   make diffs unreadable, which makes collaborating on the writeup harder
   than it needs to be.
 - Length limits given in each handout are limits on *body text*. Figures,
   tables, and references do not count against them.

2. Structure
--------------------------------------------------------------------------

Unless a milestone handout says otherwise, structure the writeup the way a
short paper is structured:

**Problem.** What question are you answering, and why does it matter for
datacenter architecture? A reader who has taken this course but not thought
about your topic should understand the stakes in one paragraph.

**Background and related work.** What is already known? Cite the papers
that establish it. This is where you show that your question has not
already been answered.

**Methodology.** What did you actually do? Enough detail that another group
in this class could repeat it: hardware, software versions, workload
configuration, what you varied and what you held fixed, and observed variation
when comparing configurations.

**Results.** What did you observe? Figures and tables with prose that
interprets them.

**Discussion.** What does it mean, where does it not generalize, and what
would you do next?

3. Figures and Tables
--------------------------------------------------------------------------

Figures do most of the work in a systems paper. Treat them accordingly.

 - Every figure needs a **caption** that states the takeaway, not just the
   contents. "Figure 3: p99 latency degrades sharply beyond 60% CPU
   utilization" is useful; "Figure 3: latency vs. utilization" is not.
 - **Label both axes, with units.** An unlabeled axis makes a plot
   unreadable and costs points.
 - Refer to every figure from the body text. A figure nobody points at will
   be assumed to be decoration.
 - Prefer vector formats (SVG, PDF) for plots and PNG for screenshots.
   Store them in `img/` in your repo and reference them relatively:

```markdown
![Tail latency vs. offered load](img/tail-latency.svg)
```

 - Do not screenshot a table of numbers. Write it as a Markdown table.
 - **Let an AI assistant do the formatting.** Turning raw benchmark output
   into a well-aligned Markdown table, or a pile of numbers into plotting
   code, is exactly the kind of mechanical work these tools are good at.
   Paste in the output and ask. Check the result against the source numbers
   -- transcription errors are yours either way -- and see [Use of AI
   Assistants](#7-use-of-ai-assistants).

4. Reporting Measurements
--------------------------------------------------------------------------

This is the section where most projects lose points, so read it carefully.

!!! danger "A comparative claim needs uncertainty"

    When comparing configurations, report observed run-to-run variation --
    standard deviation, min/max, or a confidence interval. A speedup reported
    to three significant figures without accounting for variation is not
    evidence of anything.

 - State your **baseline** explicitly and justify that it is fair. An
   optimized version of your system compared against an unoptimized
   baseline you wrote yourself is not a result.
 - For latency, report a **distribution**, not just a mean. Tail latency is
   a central theme of this course; p50/p95/p99/max is the normal reporting
   convention.
 - Identify **confounds** you could not eliminate. Noisy neighbors, thermal
   throttling, cold caches, and background daemons are all fair game, and
   naming them is a sign of rigor rather than weakness.
 - If a result surprised you and you cannot explain it, say so. An honestly
   flagged anomaly is worth more than a plausible story that does not hold
   up under questioning.

5. Citations
--------------------------------------------------------------------------

Cite inline with a short **author-year key**, and list references under the
same keys at the end:

```markdown
Tail latency compounds across fan-out services [Dean13].

## References

**[Dean13]** J. Dean and L. A. Barroso. "The Tail at Scale."
Communications of the ACM, 56(2):74-80, 2013.
```

Do not number your references. Numbers have to be renumbered by hand every
time you insert a source, and in a report three people are editing at once
the numbering will silently go wrong. Keys never change, so a citation is
correct wherever it ends up.

If you want citations to be clickable on GitHub, define each key once as a
link at the bottom of the file and the inline `[Dean13]` becomes a link
automatically:

```markdown
[Dean13]: https://doi.org/10.1145/2408776.2408794
```

Include authors, title, venue, and year. A bare URL is acceptable only for
software and documentation that has no paper.

6. Writing
--------------------------------------------------------------------------

 - Prefer the active voice and concrete subjects. "We ran the workload on
   16 cores" beats "the workload was run."
 - Define every acronym on first use.
 - Proofread. Run a spell checker over the file before you commit it.

7. Use of AI Assistants
--------------------------------------------------------------------------

AI coding tools are **expected** in this project, not merely tolerated. 
Using these tools well is a professional
skill this course assumes you have or will acquire on your own.

Using them well includes knowing where they fail. In this project that
matters concretely: generated code that looks plausible and silently
degrades answer quality, confident claims about performance counters that do
not exist on ARM64, and invented citations are all failure modes you will
encounter. **You are accountable for every line you ship and every claim you
make**, regardless of what produced it.

The limits:

 - Do not report technical claims you have not verified yourself.
 - Do not report results you have not measured.
 - Do not cite work you have not read.

Disclose substantial use in a short section at the end of your final report:
which tools, and what you used them for. Disclosure is not penalized and has
no effect on your grade. Fabricated citations or invented results are
academic integrity violations.
