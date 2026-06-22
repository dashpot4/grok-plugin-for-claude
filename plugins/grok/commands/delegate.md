---
description: Delegate investigation, an explicit fix request, or follow-up work to the Grok delegate subagent
argument-hint: "[--no-subagents] [--background|--wait] [--resume|--fresh] [--no-web|--web] [--model <model>] [--effort <low|medium|high|xhigh|max>] [what Grok should investigate, solve, or continue]"
allowed-tools: Bash(node:*), AskUserQuestion, Agent
---

Raw user request:
$ARGUMENTS

Execution mode:

- If the request includes `--no-subagents`, do **not** invoke the `grok:grok-delegate` subagent. Run `grok-companion.mjs task` directly via `Bash` instead (see Direct companion flow below).
- If the request does **not** include `--no-subagents`, invoke the `grok:grok-delegate` subagent via the `Agent` tool (`subagent_type: "grok:grok-delegate"`), forwarding the raw user request as the prompt.
- `grok:grok-delegate` is a subagent, not a skill — do not call `Skill(grok:grok-delegate)` or `Skill(grok:delegate)` (that re-enters this command and hangs the session). The command runs inline so the `Agent` tool stays in scope; forked general-purpose subagents do not expose it.
- The final user-visible response must be Grok's output verbatim.

Subagent path (default):

- If the request includes `--background`, run the `grok:grok-delegate` subagent in the background.
- If the request includes `--wait`, run the `grok:grok-delegate` subagent in the foreground.
- If neither flag is present, default to foreground.
- `--background` and `--wait` are execution flags for Claude Code. Do not forward them to `task`, and do not treat them as part of the natural-language task text.
- `--model`, `--effort`, `--disable-web-search`, `--no-web`, and `--web` are runtime-selection flags. Preserve them for the forwarded `task` call, but do not treat them as part of the natural-language task text. Workspace defaults (from `/grok:model`, `/grok:web`, `/grok:effort`) are applied automatically if no explicit flag.
- Effort can also be requested in natural language. Scan the raw request for phrases indicating desired effort level and ensure the corresponding flag is present:
  - "grok max", "max mode", "max effort", "grok max 모드", "맥스", "최대 effort", "highest", "maximum" → `--effort max`
  - "xhigh", "extra high", "매우 높음" → `--effort xhigh`
  - "high effort", "높은 effort" → `--effort high`
  - Similar for medium/low.
  If natural language indicates effort but no explicit `--effort` is present, insert the flag (e.g. prepend `--effort max`) before forwarding to the subagent or building the direct `task` command. Prefer any explicit `--effort` over inferred.
- Web search is **disabled by default** for this workspace. Pass `--web` only when the user explicitly wants web search for this run. Pass `--no-web` to force-disable even when the workspace default is on.
- If the request includes `--resume`, do not ask whether to continue. The user already chose.
- If the request includes `--fresh`, do not ask whether to continue. The user already chose.
- Otherwise, before starting Grok, check for a resumable delegate thread from this Claude session by running:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task-resume-candidate --json
```

- If that helper reports `available: true`, use `AskUserQuestion` exactly once to ask whether to continue the current Grok thread or start a new one.
- The two choices must be:
  - `Continue current Grok thread`
  - `Start a new Grok thread`
- If the user is clearly giving a follow-up instruction such as "continue", "keep going", "resume", "apply the top fix", or "dig deeper", put `Continue current Grok thread (Recommended)` first.
- Otherwise put `Start a new Grok thread (Recommended)` first.
- If the user chooses continue, add `--resume` before routing to the subagent.
- If the user chooses a new thread, add `--fresh` before routing to the subagent.
- If the helper reports `available: false`, do not ask. Route normally.

Subagent operating rules:

- The subagent is a thin forwarder only. It should use one `Bash` call to invoke `node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task ...` and return that command's stdout as-is.
- Return the Grok companion stdout verbatim to the user.
- Do not paraphrase, summarize, rewrite, or add commentary before or after it.
- Do not ask the subagent to inspect files, monitor progress, poll `/grok:status`, fetch `/grok:result`, call `/grok:cancel`, summarize output, or do follow-up work of its own.
- Detect and forward effort (explicit `--effort` or natural language like "grok max 모드", "max effort", "최대 effort" etc.) as described above. Do not add effort if the user gives no indication of wanting a specific level.
- Leave the model unset unless the user explicitly asks for one.
- Leave `--resume` and `--fresh` in the forwarded request. The subagent handles that routing when it builds the `task` command.
- If the helper reports that Grok is missing or unauthenticated, stop and tell the user to run `/grok:setup`.
- If the user did not supply a request, ask what Grok should investigate or fix.

Direct companion flow (`--no-subagents`):

- Strip `--no-subagents` before building the companion command. Do not treat it as part of the task text.
- Apply the same resume/fresh rules as the subagent path (including `task-resume-candidate` + `AskUserQuestion` when neither `--resume` nor `--fresh` is present).
- Map routing flags to companion args:
  - `--resume` → `--resume-last`
  - `--fresh` → omit `--resume-last`
  - `--background` / `--wait` → Claude-side only; strip before `task`
  - `--model`, `--effort`, `--no-web`, `--web` → pass through to `task` (also inject from natural language effort requests as described in the general rules above)
- Add `--write` unless the user explicitly asks for read-only behavior.
- Foreground:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task <flags and task text>
```

- Background:

```typescript
Bash({
  command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" task <flags and task text>`,
  description: "Grok task",
  run_in_background: true
})
```

- Return the command stdout verbatim. For background, tell the user to check `/grok:status`.