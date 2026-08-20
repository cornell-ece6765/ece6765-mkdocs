ECE 6765 MkDocs Documentation
==============================

Source for the ECE 6765 Modern Datacenter Architecture documentation site
(course project handouts).

Status
------

This repo is **public** and the site is published at
<https://cornell-ece6765.github.io/ece6765-mkdocs/>.

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

The site is deployed to GitHub Pages from the `gh-pages` branch. To publish
the current state of `main`:

```bash
source .venv/bin/activate
mkdocs gh-deploy --strict
```

That builds `docs/` and force-pushes the result to `gh-pages`; GitHub Pages
serves it at <https://cornell-ece6765.github.io/ece6765-mkdocs/> within a
minute or so. Never edit `gh-pages` by hand -- it is regenerated on every
deploy.

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
