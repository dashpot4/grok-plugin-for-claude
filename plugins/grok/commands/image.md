---
description: Generate an image using Grok
argument-hint: "[description of the image]"
allowed-tools: Bash(node:*)
---

Generate an image with Grok.

The request will be forwarded as "grok generate image of [your description]".

**Usage examples:**
- `/grok:image a majestic dragon flying over mountains at sunset`
- `/grok:image --background cyberpunk Tokyo street at night`
- `/grok:image --effort high a highly detailed portrait`

If you want to edit an existing image, use `/grok:edit-image` instead.

The command passes the request to Grok.

**Examples of full usage (including flags):**
- `/grok:image a red dragon in the mountains`
- `/grok:image --background a cyberpunk street scene`
- `/grok:image --effort high a detailed portrait of a samurai`

**How it runs:**
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok generate image $ARGUMENTS"`

(For background support with dedicated command, flags like --background are passed through to the task.)

For full control (background, resume, etc.), use `/grok:delegate grok generate image of ...` with flags.