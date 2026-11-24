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

## 2026-11-24 — Open a file in one place; "unsaved" means a hash taken after loading

- **Every "open a file" goes through `services/fileOpen.ts` (`openFile`).** It uses the
  File System Access picker only where it can work (`choosePicker`: Chrome, secure
  context, not in a frame, not refused earlier). Otherwise it clicks the caller's
  always-mounted `<input type="file">` synchronously, inside the click's user gesture:
  a `click()` after an `await` opens nothing. A refused picker fails at once, often with
  the same AbortError as Cancel (`classifyPickerFailure`), and needs an in-page "Choose
  file…" click. The Markdown and JSON panels had their own copies with the old fault.
  `test/file-open.test.cjs` fails if anything else calls `showOpenFilePicker`.
- **Recovered models are the ones changed since they were saved** (`utils/recovery.ts`),
  not the whole browser index. Compare hashes of the same data in the same shape: loading
  a file normalises it (key order, default view and board, merged schemas), so a hash of
  the raw file never matched the autosave and every opened file looked unsaved. The first
  autosave after opening a file now takes its hash as the saved one.
- Check a "fixed" picker bug in all three Playwright engines, at localhost **and** the host
  IP (not a secure context: no File System Access API). Playwright refuses the Chromium
  picker at once, which exercises the refused-picker path, not a real dialog.
