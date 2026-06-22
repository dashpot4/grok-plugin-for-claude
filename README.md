# Grok plugin for Claude Code

Use [Grok Build CLI](https://x.ai/cli) from inside Claude Code to delegate tasks or run code reviews through a Grok subagent.

Inspired by the [Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc), this plugin wraps your local `grok` binary and exposes slash commands plus a `grok:grok-delegate` subagent.

## What You Get

| Command | What it does |
|---------|--------------|
| `/grok:setup` | Check Grok install/auth, offer to install or log in |
| `/grok:login` | Sign in to Grok using the full binary path (no PATH needed) |
| `/grok:delegate` | Hand investigation, fixes, or follow-up work to Grok |
| `/grok:review` | Read-only Grok code review of your working tree or branch |
| `/grok:status` | Show running and recent Grok jobs for this repo |
| `/grok:result` | Show the final output of a finished job |
| `/grok:cancel` | Cancel an active background Grok job |

You also get the `grok:grok-delegate` subagent in `/agents`.

## Requirements

- **Grok Build CLI** with an active login
- **Node.js 18.18+** (used by the plugin runtime scripts)
- **Git** (recommended for `/grok:review`)

## Install the plugin

In Claude Code:

```text
/plugin marketplace add dashpot4/grok-plugin-for-claude
/plugin install grok@grok-build
/reload-plugins
```

For local development:

```text
/plugin marketplace add ./path/to/grok-plugin-for-claude
/plugin install grok@grok-build
/reload-plugins
```

After install you should see the slash commands above and `grok:grok-delegate` in `/agents`.

---

## First-time setup

There are two common paths depending on whether Grok is already on your machine.

### Path A — Grok is **not** installed yet (most common for new users)

This is the flow when you install Grok **from inside Claude Code** via `/grok:setup`.

**Step 1. Run setup**

```text
/grok:setup
```

Claude will check whether Grok is installed. If not, it asks whether to install. Choose **Install Grok (Recommended)**.

- **Windows**: installs to `%USERPROFILE%\.grok\bin\grok.exe`
- **macOS/Linux**: installs to `~/.grok/bin/grok`

**Step 2. Log in to Grok**

After install, `/grok:setup` asks whether to run Grok login. Choose **Run Grok login (Recommended)**.

Alternatively:

```text
/grok:login
```

**Step 3. Confirm readiness**

```text
/grok:setup
```

You should see `Status: ready`.

**Step 4. Try a first delegate**

```text
/grok:delegate say hello and list files in the current directory
```

---

### Path B — Grok is **already** installed before you open Claude Code

If you installed Grok earlier (outside Claude Code) **and** your shell PATH already includes the Grok bin directory, setup is usually one step:

```text
/grok:setup
```

If you are already logged in (`grok models` works in a normal terminal), `/grok:setup` should report `Status: ready` immediately.

You can skip `/grok:login` and go straight to:

```text
/grok:delegate investigate the failing test
```

---

## Important: `!grok login` and PATH on Windows

### The problem

`!grok login` runs a shell command inside your **current** Claude Code session. On Windows, Claude Code only sees the **PATH from when the session started**.

If Grok was installed **during** this Claude Code session (via `/grok:setup`), the new install path is **not** visible to that session yet. In that case:

```text
!grok login
```

often fails with:

```text
command not found
```

This is expected. It does **not** mean Grok failed to install.

### What to do instead

Use one of these — they work **without** restarting:

```text
/grok:login
```

or

```text
/grok:setup
```

and choose **Run Grok login**.

These call the full path (`%USERPROFILE%\.grok\bin\grok.exe` on Windows) directly.

### When you need a new Claude Code session

You need to **fully quit and reopen Claude Code** if you want `!grok` shell commands to work directly:

- after installing Grok from inside Claude Code, **and**
- you prefer typing `!grok login`, `!grok models`, etc. instead of slash commands

After restart, Windows picks up the updated user PATH and `!grok` should work.

> **Summary**
> - Installed Grok inside Claude Code → use `/grok:login` or `/grok:setup` for login
> - Want `!grok` to work → quit Claude Code completely and start a new session
> - Grok was already installed before opening Claude Code → usually no extra steps needed

The plugin runtime itself resolves `~/.grok/bin/grok.exe` directly, so `/grok:delegate` and `/grok:review` work even when `!grok` does not.

---

## Usage

### `/grok:delegate`

Hands a task to Grok through the `grok:grok-delegate` subagent.

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

| Flag | Meaning |
|------|---------|
| `--background` | Run in the background; check with `/grok:status` and `/grok:result` |
| `--wait` | Run in the foreground and wait for output |
| `--resume` | Continue the latest Grok session for this repo |
| `--fresh` | Start a new Grok session |
| `--model <id>` | Pick a model (e.g. `grok-composer-2.5-fast`) |
| `--effort <level>` | `low`, `medium`, `high`, `xhigh`, or `max` |

Delegate runs are **write-capable by default** (Grok can edit files). Ask explicitly for read-only behavior if you only want investigation or review.

### `/grok:review`

Read-only code review. Does not modify files.

```text
/grok:review
/grok:review --base main
/grok:review --background
```

| Flag | Meaning |
|------|---------|
| `--base <ref>` | Review branch diff against `main` (or another ref) |
| `--scope working-tree` | Review only uncommitted changes |
| `--scope branch` | Review against the default base branch |
| `--background` | Run review in the background |

### `/grok:status`, `/grok:result`, `/grok:cancel`

Manage background jobs:

```text
/grok:status
/grok:status task-abc123
/grok:result
/grok:result task-abc123
/grok:cancel
/grok:cancel task-abc123
```

`/grok:result` includes the Grok session ID when available. Resume that work directly in Grok:

```bash
grok resume <session-id>
```

### `/grok:setup` and `/grok:login`

```text
/grok:setup     # check install + auth, offer install/login
/grok:login     # sign in via full binary path (recommended after in-session install)
```

---

## Typical workflows

### New user: install → login → delegate

```text
/grok:setup                              # install Grok if missing
/grok:login                              # sign in (or choose login in /grok:setup)
/grok:setup                              # confirm Status: ready
/grok:delegate investigate the failing test
```

### Review before shipping

```text
/grok:review
```

### Long-running background task

```text
/grok:delegate --background investigate the flaky integration test
/grok:status
/grok:result
```

### Continue previous Grok work

```text
/grok:delegate --resume keep going and apply the smallest fix
```

---

## How it works

```text
Claude Code
  └─ /grok:delegate
       └─ grok:grok-delegate subagent
            └─ grok-companion.mjs task
                 └─ ~/.grok/bin/grok.exe -p ... --output-format json
```

The plugin:

- uses your **local** Grok install (not a remote runtime)
- reads auth from `~/.grok/auth.json`
- respects `~/.grok/config.toml` and project `.grok/config.toml`
- tracks jobs per workspace for background status/result/cancel

---

## Troubleshooting

### `!grok login` → command not found

You installed Grok inside Claude Code and have not restarted the session. Use `/grok:login` or `/grok:setup` instead, or quit and reopen Claude Code.

### `/grok:login` not in the command menu

Update the plugin:

```text
/plugin marketplace update grok-build
/plugin install grok@grok-build
/reload-plugins
```

Requires v1.0.1+. `/grok:setup` can also run login on older cached installs.

### `/grok:setup` says needs authentication

```text
/grok:login
```

or open a **new** PowerShell window, run `grok login`, then restart Claude Code.

### `/grok:delegate` fails immediately

1. Run `/grok:setup` — confirm `Status: ready`
2. If Grok is missing, install via `/grok:setup`
3. If auth is missing, run `/grok:login`
4. Update plugin to latest: `/plugin marketplace update grok-build`

### Plugin commands missing after install

```text
/reload-plugins
```

If still missing, reinstall:

```text
/plugin install grok@grok-build
/reload-plugins
```

---

## FAQ

### Do I need a separate Grok account?

No. The plugin uses your local Grok CLI login. Sign in once with `/grok:login` or `grok login`.

### Does the plugin use a separate Grok runtime?

No. It calls the same `grok` binary installed on your machine.

### Will it use my existing Grok config?

Yes. Same config and auth as running `grok` directly in a terminal.

### I already use Codex in Claude Code. Can I use both?

Yes. This plugin is independent of the Codex plugin. Use `/codex:rescue` for Codex and `/grok:delegate` for Grok.

---

## Development

```bash
npm test
node plugins/grok/scripts/grok-companion.mjs setup
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).