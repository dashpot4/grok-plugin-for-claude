---
description: Transcribe audio to text using Grok
argument-hint: "[path to audio file]"
allowed-tools: Bash(node:*)
---

Transcribe speech from an audio file.

Example:
`/grok:stt ./meeting.mp3`

Foreground:
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "grok transcribe $ARGUMENTS"`

The transcription will be returned in the result.