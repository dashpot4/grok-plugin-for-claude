# Changelog

## 1.0.5 — 2026-06-23

- Add `--disable-web-search` and `--no-web` to `/grok:delegate`, `/grok:review`, and `grok-companion task|review`
- Pass the flag through to Grok CLI to avoid web-search failures on large prompts (for example ~20k-token handoffs returning `400 Bad Request`)

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