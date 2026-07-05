---
description: Generate a video using Grok
argument-hint: "[description of the video]"
allowed-tools: Bash(node:*)
---

Generate a video with Grok.

Example:
`/grok:video gentle waves on a tropical beach, slow motion`

Foreground:
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok generate video $ARGUMENTS"`

For editing an existing video, use `/grok:edit-video`.