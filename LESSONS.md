# Lessons — Tapestry

Notes accumulated while working on this repo. Cross-cutting lessons that would help
future work beyond a single ticket get promoted to the team level
(`teams/tapestry/lessons/`); see the Tapestry team's `processes/lesson-flow.md`.

This file commits with the repo and travels with the code.

---

## 2026-06-17 — `gcloud-sdk/` must never be vendored into git

The Google Cloud SDK was committed into `gcloud-sdk/` — 634MB across ~40,671
files, 99.6% of everything tracked. It bloated every clone and dominated history.
It was removed from the working tree and purged from history. **Do not re-add it.**
If the SDK is needed locally, install it outside the repo and rely on `PATH`, or
add an explicit install step to deploy tooling — never vendor it into git. The
`.gitignore` now blocks `gcloud-sdk/` to prevent recurrence.
