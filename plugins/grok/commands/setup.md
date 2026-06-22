---
description: Check whether the local Grok Build CLI is ready and optionally install it
argument-hint: ''
allowed-tools: Bash(node:*), Bash(powershell:*), Bash(curl:*), AskUserQuestion
---

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" setup --json $ARGUMENTS
```

If the result says Grok is unavailable:
- Use `AskUserQuestion` exactly once to ask whether Claude should install Grok now.
- Put the install option first and suffix it with `(Recommended)`.
- Use these two options:
  - `Install Grok (Recommended)`
  - `Skip for now`
- If the user chooses install on Windows, run:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://x.ai/cli/install.ps1 | iex"
```

- If the user chooses install on macOS/Linux, run:

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

- Then rerun:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" setup --json $ARGUMENTS
```

If Grok is already installed:
- Do not ask about installation.

Output rules:
- Present the final setup output to the user.
- If installation was skipped, present the original setup output.
- If Grok is installed but not authenticated, preserve the guidance to run `!grok login`.