---
description: Analyze an image using Grok's vision capabilities
argument-hint: "[path to image] [optional: what to analyze]"
allowed-tools: Bash(node:*)
---

Use Grok to analyze or describe an image (vision).

Examples:
- `/grok:vision ./screenshot.png`
- `/grok:vision ./design.png what are the main UI issues?`
- `/grok:vision ./chart.jpg extract the data as text`

Foreground:
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok analyze image $ARGUMENTS"`

This passes the image path to Grok for vision processing.