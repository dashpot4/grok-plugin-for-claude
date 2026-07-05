---
description: Edit an existing video using Grok
argument-hint: "[path to video] [edit instructions]"
allowed-tools: Bash(node:*)
---

Edit a video file with Grok.

Example:
`/grok:edit-video ./clip.mp4 change the sky to a dramatic sunset`

Foreground:
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok edit video $ARGUMENTS"`

For generating a new video, use `/grok:video`.