---
description: View or change the default Grok model for this workspace
argument-hint: "[model-id]"
allowed-tools: Bash(node:*), AskUserQuestion
---

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" model --json $ARGUMENTS
```

If `$ARGUMENTS` already contains a model id (for example `grok-build`), treat it as a direct selection and run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" model --set <model-id> --json
```

Otherwise:
- Use the JSON `choices` array from the first command.
- Use `AskUserQuestion` exactly once to ask which Grok model to use for this workspace.
- Build one option per choice using each choice's `optionLabel`.
- Put the current selection first and suffix it with `(Recommended)`.
- After the user chooses, map the answer back to the matching choice `id` and run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/grok-companion.mjs" model --set <model-id> --json
```

Output rules:
- Present the final model command output to the user.
- If Grok is missing or unauthenticated, tell the user to run `/grok:setup`.
- Explain that the saved model applies to future `/grok:delegate` and `/grok:review` runs unless the user passes `--model`.