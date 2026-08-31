---
description: View or change the default Grok model for this workspace
argument-hint: "[grok-4.6|grok-4.5|none]"
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" model "$ARGUMENTS"`

Present the command output to the user exactly as-is.

If the user passed a model id or alias, confirm it was saved for this workspace.

If the user passed no arguments, do not ask follow-up questions. The output already lists choices and shows how to switch (for example `/grok:model grok-4.6`, or `/grok:model none` to follow the Grok CLI default).
