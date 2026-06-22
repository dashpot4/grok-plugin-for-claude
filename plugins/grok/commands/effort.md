---
description: View or change the default Grok reasoning effort for this workspace
argument-hint: "[low|medium|high|xhigh|max|none|clear]"
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" effort "$ARGUMENTS"`

Present the command output to the user exactly as-is.

If the user passed a setting, confirm it was saved for this workspace.

If the user passed no arguments, do not ask follow-up questions. The output already explains how to switch (for example `/grok:effort high`).

Use "none" or "clear" to remove the workspace default (Grok will choose).