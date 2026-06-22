---
name: grok-result-handling
description: Internal guidance for presenting Grok helper output back to the user
user-invocable: false
---

# Grok Result Handling

When a slash command or subagent returns Grok companion output:

- Present the stdout verbatim unless the command instructions say otherwise.
- Do not paraphrase, summarize, or add commentary before or after Grok output for delegate and review commands.
- If the output includes a Grok session ID, preserve it so the user can run `grok resume <session-id>` directly.
- For background jobs, tell the user to check `/grok:status` and `/grok:result`.
- If setup reports Grok is missing or unauthenticated, direct the user to `/grok:setup` or `!grok login`.