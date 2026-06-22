# Grok plugin for Claude Code

Use [Grok Build CLI](https://x.ai/cli) from inside Claude Code to delegate tasks or run code reviews through a Grok subagent.

Inspired by the [Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc), this plugin wraps your local `grok` binary and exposes slash commands plus a `grok:grok-delegate` subagent.

## What You Get

- `/grok:delegate` — hand investigation, fixes, or follow-up work to Grok
- `/grok:review` — read-only Grok code review of your working tree or branch
- `/grok:status`, `/grok:result`, `/grok:cancel` — manage background Grok jobs
- `/grok:setup` — check whether Grok is installed and authenticated

## Requirements

- **Grok Build CLI** with an active login (`grok login`)
- **Node.js 18.18 or later** (ships with the plugin runtime scripts)
- **Git** (recommended for review commands)

## Install

### From this repository

In Claude Code:

```text
/plugin marketplace add dashpot4/grok-plugin-for-claude
/plugin install grok@grok-build
/reload-plugins
/grok:setup
```

### Local development

```text
/plugin marketplace add ./path/to/grok-plugin-for-claude
/plugin install grok@grok-build
/reload-plugins
/grok:setup
```

After install you should see:

- the slash commands above
- the `grok:grok-delegate` subagent in `/agents`

A simple first run:

```text
/grok:delegate --background investigate why the tests are failing
/grok:status
/grok:result
```

## Usage

### `/grok:delegate`

Hands a task to Grok through the `grok:grok-delegate` subagent.

Examples:

```text
/grok:delegate investigate why the build is failing in CI
/grok:delegate fix the failing test with the smallest safe patch
/grok:delegate --resume apply the top fix from the last run
/grok:delegate --model grok-composer-2.5-fast --effort high investigate the flaky test
/grok:delegate --background investigate the regression
```

You can also ask naturally:

```text
Ask Grok to redesign the database connection to be more resilient.
```

Notes:

- `--background` and `--wait` control Claude-side execution, not Grok itself
- `--resume` continues the latest Grok session for this repo
- `--fresh` starts a new Grok session
- delegate runs are write-capable by default (`--write`); ask for read-only behavior explicitly if needed

### `/grok:review`

Runs a read-only Grok review on your current work.

Examples:

```text
/grok:review
/grok:review --base main
/grok:review --background
```

This command does not modify files.

### `/grok:status`

Shows running and recent Grok jobs for the current repository.

```text
/grok:status
/grok:status task-abc123
```

### `/grok:result`

Shows the final stored Grok output for a finished job. When available, includes the Grok session ID so you can reopen the run with `grok resume <session-id>`.

```text
/grok:result
/grok:result task-abc123
```

### `/grok:cancel`

Cancels an active background Grok job.

```text
/grok:cancel
/grok:cancel task-abc123
```

### `/grok:setup`

Checks whether Grok is installed and authenticated. On Windows it can offer to run the official PowerShell installer; on macOS/Linux it can offer the shell installer.

## Typical Flows

### Review before shipping

```text
/grok:review
```

### Hand a problem to Grok

```text
/grok:delegate investigate why the build is failing in CI
```

### Start something long-running

```text
/grok:delegate --background investigate the flaky test
```

Then check in with:

```text
/grok:status
/grok:result
```

## Grok Integration

The plugin delegates through your local Grok Build CLI:

- same `grok` install you would use directly
- same authentication in `~/.grok/auth.json`
- same repository checkout and machine-local environment
- respects user-level and project-level Grok config in `~/.grok/config.toml` and `.grok/config.toml`

Resume delegated work directly in Grok:

```bash
grok resume <session-id>
```

Use the session ID from `/grok:result` or `/grok:status`.

## Architecture

```text
Claude Code
  └─ /grok:delegate
       └─ grok:grok-delegate subagent
            └─ grok-companion.mjs task
                 └─ grok -p ... --output-format json
```

The companion script also tracks jobs per workspace so background runs, status, result, and cancel work like the Codex plugin.

## FAQ

### Do I need a separate Grok account?

No. The plugin uses your local Grok CLI authentication. Run `/grok:setup` or `grok login` if you are not signed in yet.

### Does the plugin use a separate Grok runtime?

No. It shells out to the same Grok Build CLI installed on your machine.

### Can I keep using my current Grok config?

Yes. The plugin picks up the same configuration Grok would use when run directly.

## Development

```bash
npm test
node plugins/grok/scripts/grok-companion.mjs setup
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).