---
description: Check whether the local Grok Build CLI is ready, optionally install it, and sign in
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

If Grok is installed but not authenticated:
- Use `AskUserQuestion` exactly once to ask whether Claude should run Grok login now.
- Use these two options:
  - `Run Grok login (Recommended)`
  - `Skip for now`
- If the user chooses login on Windows, run:

```bash
powershell -NoProfile -Command "& \"$env:USERPROFILE\.grok\bin\grok.exe\" login"
```

- If the user chooses login on macOS/Linux, run:

```bash
"$HOME/.grok/bin/grok" login
```

- Then rerun setup:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" setup --json $ARGUMENTS
```

Output rules:
- Present the final setup output to the user.
- When setup is ready, the output includes workspace settings (default model, web search default). Present those lines to the user.
- If installation or login was skipped, present the original setup output.
- If `!grok login` fails with command not found, explain that Claude Code may have started before PATH was updated. Recommend the PowerShell login command above or restarting Claude Code after adding `%USERPROFILE%\.grok\bin` to PATH.