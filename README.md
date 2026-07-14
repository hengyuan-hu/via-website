# VIA Website

Static site for **VIA: Visual Interface Agent for Robot Control**.

Self-contained: page files at the root, all rollout videos, transcripts, and
tool demo clips under `data/`. No build step is needed to view it.

## View locally

```bash
python3 -m http.server 7899   # from the repo root
```

Then open <http://localhost:7899/>.

## Provenance

This repo is generated from the research repo's `website/` folder: the
`../data/...` media references are rewritten to `data/...` and the referenced
files are copied in. Edit the site there (see its `website/README.md` for the
`build_manifest.py` / `build_tools.py` workflow), then regenerate this repo.
