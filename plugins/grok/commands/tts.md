---
description: Convert text to speech using Grok
argument-hint: "[text to speak]"
allowed-tools: Bash(node:*)
---

Generate speech audio from text.

Example:
`/grok:tts Welcome to the future of AI coding.`

Foreground:
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok speak $ARGUMENTS"`

The output audio file path will be provided in the result.