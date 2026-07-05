---
description: Edit an existing image using Grok
argument-hint: "[path to image] [instructions for the edit]"
allowed-tools: Bash(node:*)
---

Edit an existing image with Grok.

Example:
`/grok:edit-image ./photo.jpg make it look like a Studio Ghibli animation`

Internally runs:
`grok edit image [path] [instructions]`

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok edit image $ARGUMENTS"`

For generation instead of editing, use `/grok:image`.

Supports the same flags as delegate (pass them before the path if needed).