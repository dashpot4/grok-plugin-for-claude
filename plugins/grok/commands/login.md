---
description: Sign in to Grok Build CLI using the default install path
argument-hint: ''
allowed-tools: Bash(powershell:*)
---

Run Grok login with the full binary path so Claude Code does not depend on PATH:

```bash
powershell -NoProfile -Command "& \"$env:USERPROFILE\.grok\bin\grok.exe\" login"
```

On macOS/Linux, use:

```bash
"$HOME/.grok/bin/grok" login
```

Present the login result to the user.

If login succeeds, tell the user to run `/grok:setup` to confirm readiness.

If the binary is missing, tell the user to run `/grok:setup` and install Grok first.