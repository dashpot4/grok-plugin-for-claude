---
name: grok-cli-runtime
description: Internal helper contract for calling the grok-companion runtime from Claude Code
user-invocable: false
---

# Grok Runtime

Use this skill only inside the `grok:grok-delegate` subagent.

Primary helper:
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task "<raw arguments>"`

Execution rules:
- The delegate subagent is a forwarder, not an orchestrator. Its only job is to invoke `task` once and return that stdout unchanged.
- Prefer the helper over hand-rolled direct Grok CLI strings or any other Bash activity.
- Do not call `setup`, `review`, `status`, `result`, or `cancel` from `grok:grok-delegate`.
- Use `task` for every delegate request, including diagnosis, planning, research, and explicit fix requests.
- Workspace effort default (from `/grok:effort`) applies automatically unless overridden here.
- Detect effort requests from the user's request text (both explicit flags and natural language) to override. Map phrases such as:
  - "max", "maximum", "grok max", "max mode", "max effort", "맥스", "grok max 모드", "최대", "highest", "maximum effort" → `--effort max`
  - "xhigh", "extra high", "x-high", "매우 높음" → `--effort xhigh`
  - "high", "높음", "high effort" → `--effort high`
  - "medium", "중간", "보통" → `--effort medium`
  - "low", "낮음", "low effort" → `--effort low`
  If a specific effort is clearly requested (in any form), include the corresponding `--effort <level>` when building the `task` command.
- Leave model unset by default. Add `--model` only when the user explicitly asks for one.
- Advanced Grok features support (image/video, vision, files, search, code):
  - Recognize and forward accurately: "generate image", "edit image at [path]", "analyze image [path]", "grok vision", "generate video", "edit video", "upload file at [path]", "brainstorm", "grok search x", "run code", "calculate".
  - Preserve every file path, URL, or detail exactly. Do not summarize or alter paths.
  - Vision/analysis: Include the image path in the prompt so the `grok` binary can process it.
  - Generation/edit: The upstream delegation usually enables writes when needed.
- Permission handling (key for file/folder operations):
  - File access (read for vision, write for edits/generation) is handled by the `grok` process in the workspace cwd.
  - Be explicit with paths in the `node ... task` command. If permission problems arise (e.g. "permission denied"), the output will surface them for the main Claude session to handle or re-delegate with different scope.
  - Do not hide or auto-resolve permissions. Structure the forwarded prompt so the main Claude can approve the initial Bash delegation or use --no-subagents for more control.
  - For sensitive or complex file tasks, the subagent should just forward cleanly; permission decisions stay with the user/Claude main thread.
- Default to write-capable Grok work in `grok:grok-delegate` unless the user explicitly asks for read-only behavior.
- Preserve the user's task text as-is apart from stripping routing flags.
- Do not inspect the repository, solve the task yourself, or add independent analysis outside the forwarded prompt text.
- Return the stdout of the `task` command exactly as-is.
- If the Bash call fails or Grok cannot be invoked, return nothing.

Command selection:
- Use exactly one `task` invocation per delegate handoff.
- If the forwarded request includes `--background` or `--wait`, treat that as Claude-side execution control only. Strip it before calling `task`, and do not treat it as part of the natural-language task text.
- If the forwarded request includes `--model`, pass it through to `task`.
- If the (forwarded or natural-language) request indicates a specific effort level, include `--effort <level>` in the `task` command.
- Web search is disabled by default. Pass `--web` through to `task` only when the user explicitly asks for web search. Pass `--no-web` when the user asks to force-disable web search for this run. Strip these flags from the natural-language task text.
- If the forwarded request includes `--resume`, strip that token from the task text and add `--resume-last`.
- If the forwarded request includes `--fresh`, strip that token from the task text and do not add `--resume-last`.
- `--effort`: accepted values are `low`, `medium`, `high`, `xhigh`, `max`.
- `task --resume-last`: internal helper for follow-up instructions after a previous delegate run.