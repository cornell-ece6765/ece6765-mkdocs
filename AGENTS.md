# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, or any other) working in this
repository. Read this before starting work.

## What this repository is

The MkDocs source for the **ECE 6765 Modern Datacenter Architecture** (Cornell,
Prof. Mohammad Alian) course-project documentation site. It holds the student-
facing handouts and nothing else — no course code, no grading scripts.

```
mkdocs.yml            site config, the draft list, and the nav
requirements.txt      pinned mkdocs-material; upgrade deliberately
docs/
  index.md                        landing page with the milestone cards
  ece6765-project-overview.md     logistics, groups, hardware, grading criteria
  ece6765-project-m[1-4].md       the four milestone handouts
  ece6765-project-arch.md         the fixed service contract (API shapes)
  ece6765-eval-harness.md         what the evaluator measures and reports
  ece6765-server-guide.md         server access and measurement hygiene
  ece6765-report-guidelines.md    writeup format
  ece6765-git-workflow.md         team repo usage and submission collection
  img/ js/ stylesheets/
theme/                custom_dir for template overrides
site/                 build output — gitignored, never committed
.venv/                local preview environment — gitignored
```

**This repository is public and the site is live.** Anything committed to `main`
and deployed is visible to students immediately. There is no staging site.

## Start here

```bash
source .venv/bin/activate     # create with: python3 -m venv .venv && pip install -r requirements.txt
mkdocs serve                  # preview at http://127.0.0.1:8000, drafts visible with a banner
mkdocs build --strict         # one-shot build into site/; broken links become errors
mkdocs gh-deploy --strict     # build + force-push to gh-pages (this publishes)
```

Always use `--strict`. It turns broken internal links and bad nav entries into
build failures, and it is the only automatic check this repository has.

Never edit the `gh-pages` branch by hand — `gh-deploy` regenerates it wholesale.

## The sibling repository, and why it constrains this one

The starter code and the evaluation harness live in
`cornell-ece6765/ece6765-project` (private; see its own `AGENTS.md`). Staff
release that starter into private per-team repositories `cornell-ece6765/team-XX`,
checked out on each team server at `/team-XX/ece6765-project/`.

Handouts here make factual claims about how that harness behaves. **Verify those
claims against the code before changing them**, because a handout that contradicts
the harness costs every team a debugging session. The claims that have to stay in
sync as of the M1 release:

- Four public 100-query traces, each run **once** (`evaluate.py` `--runs`
  defaults to 1).
- One unmeasured warm-up on the first trace record, then a single `POST /query`
  batch.
- Reported metrics: the applicable quality score, `requests_per_second`, and
  p50/p95/p99/max completion latency.
- The batch-wall-time vs. `max(last_token_ms)` comparison is **diagnostic only**
  — never a pass/fail gate.
- The launcher resolves `/team-XX/embeddings.npy` from the canonical checkout
  path, so `EMBEDDINGS_PATH` is only for nonstandard layouts.

You cannot run the pipeline from a development machine: both Pixi workspaces
declare `linux-aarch64` only, and the workload targets the Ampere Altra servers.
Read the code to verify a claim; ask for a run on a team server when a real
measurement is needed.

## Milestone handouts are released one at a time

This is the most important mechanic in the repository and it is easy to get
wrong. An unreleased handout is held back by **three** independent things:

1. It is listed under `draft_docs:` in `mkdocs.yml` — visible under
   `mkdocs serve` with a DRAFT banner, omitted from `mkdocs build` and
   `gh-deploy`.
2. It has no entry under `nav:`.
3. Its card in `docs/index.md` is plain text marked *not yet released* rather
   than a link.

To release milestone N, do all three in the same commit: delete its line from
`draft_docs:`, add its `nav:` entry under `Project`, and turn its `index.md`
card into a link marked *released*. Missing any one of them either publishes a
page nobody can navigate to, or advertises a link that 404s.

As of 2026-09-16: **M1 is released; M2, M3, and M4 are still drafts** and each
still carries the `_TBD_` placeholders described below.

## What never ships in a published handout

Mohammad announces these separately, and they get revised after a handout is
published:

- **The milestone weight.** Delete the `**Weight:**` bullet entirely.
- **The grading rubric.** Delete the whole section and its table, but keep the
  "feedback will be pushed to your group repository as `mN-feedback-<DATE>.md`"
  sentence — move it to the end of *What to Submit* — and renumber the sections
  that follow.
- **The deadline.** Never inline a date. Link to the course schedule:
  <https://www.csl.cornell.edu/courses/ece6765/schedule.html>.

The draft handouts carry `_TBD_` markers where these belong. Grep for `TBD`
before publishing anything; a released page must have none.

## `\malian{...}` is an instruction to you

Mohammad leaves inline review comments in the markdown in the form
`\malian{do this}`. They are editing instructions, not content: act on them and
delete the marker. `grep -rn 'malian{' docs/` before any release — a marker that
reaches the live site is a visible mistake.

## Publish checklist

Run all of it. The site is live and students read it the moment it deploys.

```bash
grep -rn 'malian{\|TBD' docs/          # must be empty for released pages
mkdocs build --strict                  # must exit clean
git add -A docs/ && git commit && git push origin main
mkdocs gh-deploy --strict
```

Then verify against the **live** site, not the local build — GitHub Pages takes
a minute and caches:

- Every released page returns 200 and every draft page returns 404.
- The released handout's headings are numbered correctly after any section
  removal.
- Anchored cross-page links resolve. `--strict` validates that the target *file*
  exists but **not** that the `#anchor` in it does, so fetch the target page and
  grep for `id="<anchor>"`.
- External links (course site, schedule, GitHub org, Pixi docs) still resolve.

## Course facts the docs encode

Change these in lockstep with reality; several pages repeat them.

- **15 teams**, `team-01` … `team-15`, of **three or four students** each.
- Each team has a dedicated server named after its team number:
  `altra-<XX>.ece.cornell.edu`, XX = `01`–`15`. `altra-16` does not exist.
- The M1 starter is the annotated tag **`m1-release`** in `ece6765-project`,
  pushed identically to every team repo. The handout tells groups to confirm
  with `git describe --tags`.
- Team repos are private, `main` is unprotected, and students push to `main`
  directly. **They now contain student work** — seeding a team repo by pushing
  to it is no longer safe, and force-pushing one would destroy a submission.

## Writing conventions

Match the existing pages; they are deliberately uniform.

- Page titles and section headings use setext underlines (`===` and `---`), and
  sections are numbered (`2. What to Do`, `### 2.1. Set up the released
  baseline`). Renumber the rest when you remove one.
- Prose wraps at roughly 75 columns. Tables and long URLs are the exceptions.
- `--` for em dashes, not `—`.
- Submission requirements are `- [ ]` task-list checkboxes.
- Use Material admonitions (`!!! danger`, `!!! warning`, `!!! tip`,
  `??? question` for collapsible FAQ entries) rather than bold paragraphs.
- Address the group as "you". State what must be accomplished and reported,
  never how to implement it — the handouts are deliberately open-ended and the
  overview promises students exactly that.
- Write for someone who has not read the other pages: cross-link instead of
  restating, and keep the anchor targets stable.

## Scope and approval

- Publishing is outward-facing and immediate. Deploy when asked to publish, not
  as a tidy-up at the end of an unrelated change.
- Never push to `cornell-ece6765/team-XX` or to `ece6765-project` from work in
  this repository.
- Milestone content is set by the instructor. Do not add requirements,
  thresholds, or rubric criteria to a handout because they look missing.

## Keep this file current

When you learn something durable and prescriptive about working here — a release
step that was easy to miss, a convention you had to infer, a fact the docs
encode — add it. Re-check `git status`, `git log`, and the live site rather than
trusting what you believed earlier in the session; this repository is also
edited outside agent sessions. Transient progress does not belong here.
