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

## 2026-11-24 — A file window can be intercepted; always offer a label and a drop zone

- **"Intercepted by Page.setInterceptFileChooserDialog()"** means the browser is driven over
  the DevTools protocol (an automation tool, an embedded browser pane). Every file window,
  the picker's and the `<input type="file">`'s, goes to the automation tool, not the user,
  and nothing in the page shows. Playwright's own Chromium gives the same AbortError, so a
  Playwright run reproduces it. `classifyPickerFailure` treats any "intercept" message as
  blocked, whatever the timing.
- **Clicking "Choose file…" after an `await` is not reliable**: the step is now a
  `<label htmlFor>` for the always-mounted input (`components/FileChooser.tsx`), which opens
  the file window within the user's own click; Enter and Space call `input.click()` in the
  keydown.
- **Drag-and-drop works when no file window can open.** Dropped files are handed to the same
  input (`dropFiles` → `deliverToInput`: set `input.files`, fire `change`), so they take the
  exact import path of a chosen file; non-matching files are refused in the page. The start
  screen takes a model dropped anywhere.
- A blocked window can't be detected for certain: no `change`, `cancel` or window `blur`
  within 1.5 s of the click is the signal (`watchChooser`), and then the step explains it.
  The drop zone stays visible regardless.

## 2026-11-24 — Every AI feature through callAI; the shared key never leaves the server

- **One way in:** every AI feature calls `callAI` (`utils.ts`). Components describe output
  and tools with `services/aiSchema.ts` (`Type`, `Schema`), never a provider SDK. For the
  server provider, `services/aiRequest.ts` sends structured output as `response_format`
  json_schema (strict off; an array schema is wrapped as `{ result }` and unwrapped) and
  function declarations as OpenAI tools. The Gemini SDK is only in `services/geminiClient.ts`,
  loaded with a dynamic import for a user's own Gemini key. `test/ai-provider-guard.test.cjs`
  fails if a component goes round this.
- **gpt-5.x takes function tools on chat completions only with `reasoning_effort: 'none'`**
  (400 otherwise). Other models reject the parameter, so `server/ai.js` retries once with it
  only when the 400 names `reasoning_effort`.
- **Upstream errors can quote a key without its `sk-`:** `redact(s, key)` removes any run that
  is part of the key or holds 12 of its characters in a row. `test/key-leak.test.cjs` checks the
  bundle, a running instance and a worst-case echoing upstream against the real key file.
- The build refuses `API_KEY`/`GEMINI_API_KEY` (`vite.config.ts`): Vite's `define` ends up in
  the bundle.
- Gemini schemas and a single structured-output call can't also take native tools on every
  provider, so the script `ai.propose` returns its graph changes in the schema's `actions`.
