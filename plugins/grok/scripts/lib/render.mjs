import { formatModelLabel } from "./model.mjs";

function formatJobLine(job) {
  const parts = [job.id, `${job.status || "unknown"}`];
  if (job.kindLabel) {
    parts.push(job.kindLabel);
  }
  if (job.title) {
    parts.push(job.title);
  }
  return parts.join(" | ");
}

function escapeMarkdownCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function formatGrokResumeCommand(job) {
  if (!job?.threadId) {
    return null;
  }
  return `grok resume ${job.threadId}`;
}

function appendActiveJobsTable(lines, jobs) {
  lines.push("Active jobs:");
  lines.push("| Job | Kind | Status | Phase | Elapsed | Grok Session ID | Summary | Actions |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const job of jobs) {
    const actions = [`/grok:status ${job.id}`];
    if (job.status === "queued" || job.status === "running") {
      actions.push(`/grok:cancel ${job.id}`);
    }
    lines.push(
      `| ${escapeMarkdownCell(job.id)} | ${escapeMarkdownCell(job.kindLabel)} | ${escapeMarkdownCell(job.status)} | ${escapeMarkdownCell(job.phase ?? "")} | ${escapeMarkdownCell(job.elapsed ?? "")} | ${escapeMarkdownCell(job.threadId ?? "")} | ${escapeMarkdownCell(job.summary ?? "")} | ${actions.map((action) => `\`${action}\``).join("<br>")} |`
    );
  }
}

function pushJobDetails(lines, job, options = {}) {
  lines.push(`- ${formatJobLine(job)}`);
  if (job.summary) {
    lines.push(`  Summary: ${job.summary}`);
  }
  if (job.phase) {
    lines.push(`  Phase: ${job.phase}`);
  }
  if (options.showElapsed && job.elapsed) {
    lines.push(`  Elapsed: ${job.elapsed}`);
  }
  if (options.showDuration && job.duration) {
    lines.push(`  Duration: ${job.duration}`);
  }
  if (job.threadId) {
    lines.push(`  Grok session ID: ${job.threadId}`);
  }
  const resumeCommand = formatGrokResumeCommand(job);
  if (resumeCommand) {
    lines.push(`  Resume in Grok: ${resumeCommand}`);
  }
  if (job.logFile && options.showLog) {
    lines.push(`  Log: ${job.logFile}`);
  }
  if ((job.status === "queued" || job.status === "running") && options.showCancelHint) {
    lines.push(`  Cancel: /grok:cancel ${job.id}`);
  }
  if (job.status !== "queued" && job.status !== "running" && options.showResultHint) {
    lines.push(`  Result: /grok:result ${job.id}`);
  }
  if (job.progressPreview?.length) {
    lines.push("  Progress:");
    for (const line of job.progressPreview) {
      lines.push(`    ${line}`);
    }
  }
}

export function renderWebReport(report) {
  const lines = [
    "# Grok Web Search",
    "",
    `Default: ${report.label}`,
    `Web search enabled: ${report.webSearchEnabled ? "yes" : "no"}`,
    ""
  ];

  if (report.changed) {
    lines.push(
      "Saved for this workspace. Future `/grok:delegate` and `/grok:review` runs use this default unless you pass `--web` or `--no-web`."
    );
    lines.push("");
  } else if (report.action === "show") {
    lines.push("Per-run overrides:");
    lines.push("- Enable web search for one run: `--web`");
    lines.push("- Disable web search for one run: `--no-web`");
    lines.push("");
    lines.push("Change workspace default: `/grok:web on` or `/grok:web off`");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function renderEffortReport(report) {
  const lines = [
    "# Grok Reasoning Effort",
    "",
    `Default: ${report.label}`,
    ""
  ];

  if (report.changed) {
    lines.push(
      "Saved for this workspace. Future `/grok:delegate` and `/grok:review` runs use this default unless you pass an explicit `--effort`."
    );
    lines.push("");
    lines.push("Change with: `/grok:effort high` or `/grok:effort none` (to clear)");
  } else if (report.action === "show") {
    lines.push("Per-run overrides:");
    lines.push("- Set for one run: `--effort high` (or max, xhigh, medium, low)");
    lines.push("");
    lines.push("Change workspace default: `/grok:effort high` (or none to clear)");
  }

  return `${lines.join("\n")}\n`;
}

export function renderModelReport(report) {
  const lines = [
    "# Grok Model",
    "",
    `Selected: ${report.selectedLabel} (\`${report.selectedModel}\`)`,
    `Plugin default: ${formatModelLabel(report.pluginDefault)}`,
    ""
  ];

  if (report.cliDefault) {
    lines.push(`Grok CLI default: \`${report.cliDefault}\``);
    lines.push("");
  }

  if (report.changed) {
    lines.push("Saved for this workspace. Future `/grok:delegate` and `/grok:review` runs will use this model unless you pass `--model`.");
    lines.push("");
  } else if (report.action === "show") {
    lines.push("Available models:");
    for (const choice of report.choices ?? []) {
      const marker = choice.isSelected ? "*" : "-";
      lines.push(`${marker} ${choice.label} (\`${choice.id}\`)`);
    }
    lines.push("");
    lines.push("Change model: `/grok:model grok-build` or `/grok:model composer`");
    lines.push("");
  }

  if (report.isValidSelection === false) {
    lines.push(`Warning: selected model is not currently available from \`grok models\`.`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function renderSetupReport(report) {
  const lines = [
    "# Grok Setup",
    "",
    `Status: ${report.ready ? "ready" : "needs attention"}`,
    "",
    "Checks:",
    `- node: ${report.node.detail}`,
    `- grok: ${report.grok.detail}`,
    `- auth: ${report.auth.detail}`,
    `- session runtime: ${report.sessionRuntime.label}`,
    ""
  ];

  if (report.actionsTaken.length > 0) {
    lines.push("Actions taken:");
    for (const action of report.actionsTaken) {
      lines.push(`- ${action}`);
    }
    lines.push("");
  }

  if (!report.grok.available) {
    lines.push("Install Grok CLI:");
    lines.push("- Windows (PowerShell): `irm https://x.ai/cli/install.ps1 | iex`");
    lines.push("- macOS/Linux: `curl -fsSL https://x.ai/cli/install.sh | bash`");
    lines.push("- Or run `/grok:setup` and choose install when prompted.");
    lines.push("");
  }

  if (report.grok.available && !report.auth.authenticated) {
    lines.push("Authenticate Grok:");
    if (process.platform === "win32") {
      lines.push(`- Run \`!${report.grok.installDir}\\\\grok.exe login\` in Claude Code`);
      lines.push("- Or run `grok login` in a new PowerShell window");
    } else {
      lines.push(`- Run \`!${report.grok.installDir}/grok login\` in Claude Code`);
      lines.push("- Or run `grok login` in your terminal");
    }
    lines.push("- If `!grok login` says command not found, Claude Code was started before PATH was updated. Restart Claude Code or use the full path above.");
    lines.push("");
  }

  if (report.grok.available && report.grok.command !== "grok") {
    lines.push(`Grok binary: ${report.grok.command}`);
    lines.push("Claude Code is using the default install path because `grok` is not on PATH in this session.");
    lines.push("");
  }

  if (report.workspace) {
    lines.push("Workspace settings:");
    lines.push(
      `- Default model: ${report.workspace.model.selectedLabel} (\`${report.workspace.model.selectedModel}\`)`
    );
    lines.push(`- Web search: ${report.workspace.web.label}`);
    lines.push(`- Reasoning effort: ${report.workspace.effort?.label ?? "not set"}`);
    lines.push("- Change model: `/grok:model grok-build` or `/grok:model composer`");
    lines.push("- Change web default: `/grok:web on` or `/grok:web off`");
    lines.push("- Change effort default: `/grok:effort high` (or none to clear)");
    lines.push("- Skip delegate subagent: `/grok:delegate --no-subagents ...`");
    lines.push("");
  }

  if (report.ready) {
    lines.push("Grok is ready. Try `/grok:delegate investigate the failing test` or `/grok:review`.");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderReviewResult(result, meta) {
  const text = typeof result?.finalMessage === "string" ? result.finalMessage : "";
  if (text) {
    return text.endsWith("\n") ? text : `${text}\n`;
  }

  const stderr = String(result?.stderr ?? "").trim();
  const lines = ["# Grok Review", "", `Target: ${meta.targetLabel}`];
  if (stderr) {
    lines.push("", "stderr:", "", "```text", stderr, "```");
  } else {
    lines.push("", "Grok review completed without output.");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderTaskResult(parsedResult) {
  const rawOutput = typeof parsedResult?.rawOutput === "string" ? parsedResult.rawOutput : "";
  if (rawOutput) {
    return rawOutput.endsWith("\n") ? rawOutput : `${rawOutput}\n`;
  }

  const message = String(parsedResult?.failureMessage ?? "").trim() || "Grok did not return a final message.";
  return `${message}\n`;
}

export function renderStatusReport(report) {
  const lines = ["# Grok Status", "", `Session runtime: ${report.sessionRuntime.label}`, ""];

  if (report.running.length > 0) {
    appendActiveJobsTable(lines, report.running);
    lines.push("");
    lines.push("Live details:");
    for (const job of report.running) {
      pushJobDetails(lines, job, {
        showElapsed: true,
        showLog: true
      });
    }
    lines.push("");
  }

  if (report.latestFinished) {
    lines.push("Latest finished:");
    pushJobDetails(lines, report.latestFinished, {
      showDuration: true,
      showLog: report.latestFinished.status === "failed"
    });
    lines.push("");
  }

  if (report.recent.length > 0) {
    lines.push("Recent jobs:");
    for (const job of report.recent) {
      pushJobDetails(lines, job, {
        showDuration: true,
        showLog: job.status === "failed"
      });
    }
    lines.push("");
  } else if (report.running.length === 0 && !report.latestFinished) {
    lines.push("No jobs recorded yet.", "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderJobStatusReport(job) {
  const lines = ["# Grok Job Status", ""];
  pushJobDetails(lines, job, {
    showElapsed: job.status === "queued" || job.status === "running",
    showDuration: job.status !== "queued" && job.status !== "running",
    showLog: true,
    showCancelHint: true,
    showResultHint: true
  });
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderStoredJobResult(job, storedJob) {
  const threadId = storedJob?.threadId ?? job.threadId ?? null;
  const resumeCommand = threadId ? `grok resume ${threadId}` : null;
  const rawOutput =
    (typeof storedJob?.result?.rawOutput === "string" && storedJob.result.rawOutput) ||
    (typeof storedJob?.rendered === "string" && storedJob.rendered) ||
    "";

  if (rawOutput) {
    const output = rawOutput.endsWith("\n") ? rawOutput : `${rawOutput}\n`;
    if (!threadId) {
      return output;
    }
    return `${output}\nGrok session ID: ${threadId}\nResume in Grok: ${resumeCommand}\n`;
  }

  const lines = [`# ${job.title ?? "Grok Result"}`, "", `Job: ${job.id}`, `Status: ${job.status}`];
  if (threadId) {
    lines.push(`Grok session ID: ${threadId}`);
    lines.push(`Resume in Grok: ${resumeCommand}`);
  }
  if (job.summary) {
    lines.push(`Summary: ${job.summary}`);
  }
  if (job.errorMessage || storedJob?.errorMessage) {
    lines.push("", job.errorMessage || storedJob.errorMessage);
  } else {
    lines.push("", "No captured result payload was stored for this job.");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderCancelReport(job) {
  const lines = ["# Grok Cancel", "", `Cancelled ${job.id}.`, ""];
  if (job.title) {
    lines.push(`- Title: ${job.title}`);
  }
  if (job.summary) {
    lines.push(`- Summary: ${job.summary}`);
  }
  lines.push("- Check `/grok:status` for the updated queue.");
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderQueuedTaskLaunch(payload) {
  return `${payload.title} started in the background as ${payload.jobId}. Check /grok:status ${payload.jobId} for progress.\n`;
}