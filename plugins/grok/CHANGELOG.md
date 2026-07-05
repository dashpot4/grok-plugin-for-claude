# Changelog

## 1.0.8 — 2026-07-06

**Delegate answer retrieval**
- `/grok:delegate` now returns Grok's answer **in-band by default** instead of silently backgrounding substantial tasks and forcing a `/grok:status` + `/grok:result` hunt every run
- Removed the `grok-delegate` subagent heuristic that "preferred background execution" for complicated/open-ended/long-running tasks (the exact tasks people delegate), which contradicted the forwarder's contract to return `task` stdout verbatim and the `grok-cli-runtime` skill's "strip `--background` before `task`"
- `--background` now consistently means "launch a detached Grok worker and retrieve later with `/grok:status` and `/grok:result`" — the escape hatch for runs over the Bash tool's ~10-minute limit — and is actually forwarded to `grok-companion task` on both the subagent and `--no-subagents` paths
- The forwarder returns the companion's stdout even on a non-zero exit, so a completed answer is no longer dropped when Grok exits non-zero
- Aligned `delegate.md`, the `grok-delegate` agent, the `grok-cli-runtime` / `grok-result-handling` skills, and README on one foreground-default / explicit-background model

**Reliability**
- New `SessionStart` hook (`session-lifecycle-hook.mjs`) stamps `GROK_COMPANION_SESSION_ID`, so `/grok:status`, `/grok:result`, `/grok:cancel`, and delegate resume are scoped to the Claude session that created the job instead of surfacing another session's work (completes a mechanism that was referenced but never wired)
- Foreground progress is no longer written to stderr, so the delegate forwarder's returned answer is no longer interleaved with `[grok] …` progress lines (progress still appears in `/grok:status` via the job log)
- Extracted `interpretGrokResult` with tests that lock the Grok `--output-format json` contract (`text` / `sessionId` / `stopReason`), guarding against a silent regression to the stderr fallback

## 1.0.7 — 2026-06-23

- Add `/grok:effort` command to view or change workspace default reasoning effort (`low`/`medium`/`high`/`xhigh`/`max` or `none`)
- Workspace default effort is automatically applied to `/grok:delegate` and `/grok:review` (per-run `--effort` or natural language overrides it)
- Natural language effort phrases (e.g. "grok max 모드로", "use maximum effort", "최대 effort") are now detected in delegate/review requests and converted to the proper `--effort` flag
- `/grok:setup` now shows the reasoning effort default
- Added `effort.mjs` and full wiring for defaults and per-run (including review path)

**Advanced Grok features**
- Dedicated commands added for better discoverability:
  - `/grok:image` — Generate images
  - `/grok:edit-image` — Edit existing images
  - `/grok:video` — Generate videos
  - `/grok:edit-video` — Edit existing videos
  - `/grok:vision` — Analyze/describe images with vision
  - `/grok:tts` — Text-to-speech
  - `/grok:stt` — Speech-to-text (transcribe)
- Most Grok capabilities remain usable through `/grok:delegate` via natural language (both approaches work)
- Natural language intent detection + exact file path preservation in delegate
- Strong permission and file-access guidance added to `delegate.md`, `grok-delegate` agent, skill, `setup.md`, and README so Claude can handle workspace permissions and approvals gracefully
- New "Advanced Grok Features" section in README with practical examples for both dedicated commands and natural language
- `--no-subagents` recommended for complex file/multimodal work when more direct control is needed

## 1.0.6 — 2026-06-23

- Add `/grok:delegate --no-subagents` to call `grok-companion task` directly and skip the delegate subagent
- Add `/grok:web` to view or save workspace web-search default (off by default)
- Web search is now disabled by default; pass `--web` per run to enable it
- `/grok:setup` shows workspace default model and web-search setting
- Add GitHub Actions CI (`npm test`)

## 1.0.5 — 2026-06-23

- Add `--disable-web-search` and `--no-web` to `/grok:delegate`, `/grok:review`, and `grok-companion task|review`
- Pass the flag through to Grok CLI to avoid web-search failures on large prompts (for example ~20k-token handoffs returning `400 Bad Request`)
- Sync `README.md` with version history, flags, workflows, and release checklist

## 1.0.4 — 2026-06-23

- Make `/grok:model` instant like `/grok:status` (`disable-model-invocation` + direct script output)
- Remove slow AskUserQuestion orchestration; switch models with `/grok:model grok-build` or aliases `composer` / `build`
- Use built-in model catalog by default instead of spawning `grok models` on every run

## 1.0.3 — 2026-06-23

- Add `/grok:model` to view and save the default Grok model per workspace
- Default plugin model is `grok-composer-2.5-fast` when no workspace override is saved
- `/grok:delegate` and `/grok:review` now use the saved default unless `--model` is passed

## 1.0.2 — 2026-06-23

- Fix Windows shell quoting when delegating prompts with parentheses or non-ASCII text
- Pass prompts to Grok via UTF-8 `--prompt-file` instead of inline `-p`
- Run child processes without a shell (`shell: false`) so argv is not re-parsed by cmd.exe
- Add regression tests for prompt-file invocation and Korean/parenthesis prompts

## 1.0.1 — 2026-06-23

- Add `/grok:login` command
- `/grok:setup` can now run Grok login with the full binary path on Windows
- Resolve `~/.grok/bin/grok.exe` when `grok` is missing from Claude Code PATH

## 1.0.0 — 2026-06-23

- Initial release
- `/grok:delegate` subagent integration via `grok-companion.mjs`
- `/grok:review`, `/grok:status`, `/grok:result`, `/grok:cancel`, `/grok:setup`
- Background job tracking per workspace
- Resume support via stored Grok session IDs