# Changelog

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