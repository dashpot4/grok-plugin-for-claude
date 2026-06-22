---
description: View or change the default Grok web search setting for this workspace
argument-hint: "[on|off|enable|disable]"
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" web "$ARGUMENTS"`

Present the command output to the user exactly as-is.

If the user passed a setting, confirm it was saved for this workspace.

If the user passed no arguments, do not ask follow-up questions. The output already explains how to switch (for example `/grok:web on`).