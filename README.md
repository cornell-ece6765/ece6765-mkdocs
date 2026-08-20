ECE 6765 MkDocs Documentation
==============================

Source for the ECE 6765 Modern Datacenter Architecture documentation site
(course project handouts).

Status
------

This repo is **private** and the site is **not published yet**. Build and
preview it locally while the project handouts are still being written.

Local preview
-------------

One-time setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then, from the repo root:

```bash
source .venv/bin/activate
mkdocs serve
```

Open <http://127.0.0.1:8000>. The site rebuilds automatically whenever you
save a file under `docs/`.

To do a one-shot build into `site/` (gitignored) instead:

```bash
mkdocs build --strict
```

`--strict` turns broken internal links and bad nav entries into errors,
which is worth running before you publish.

Publishing
----------

`.github/workflows/run-mkdocs.yml` is set to `workflow_dispatch` (manual)
because GitHub Pages is not available on private repos under the org's
Free plan. When the site is ready to release:

```bash
gh repo edit cornell-ece6765/ece6765-mkdocs --visibility public
```

then uncomment the `push:` trigger in the workflow and push. The site will
be served at <https://cornell-ece6765.github.io/ece6765-mkdocs>.

Layout
------

```
docs/
  index.md                         landing page
  ece6765-project-overview.md      project logistics, groups, grading
  ece6765-project-m[1-4].md        the four milestone handouts
  ece6765-report-guidelines.md     report format expectations
  ece6765-git-workflow.md          how groups use their GitHub repo
  img/                             figures (png/svg/jpg)
  stylesheets/extra.css            typography and admonition tweaks
  js/                              mathjax config + misc
theme/                             custom_dir for template overrides
```
