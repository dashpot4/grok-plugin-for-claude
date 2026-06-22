# Changelog

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