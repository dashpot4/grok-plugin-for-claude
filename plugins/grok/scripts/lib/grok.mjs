import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createTempDir } from "./fs.mjs";
import { binaryAvailable, runCommand } from "./process.mjs";

const AUTH_FILE = path.join(os.homedir(), ".grok", "auth.json");
const DEFAULT_GROK_BIN_DIR = path.join(os.homedir(), ".grok", "bin");
export const DEFAULT_CONTINUE_PROMPT = "Continue from where you left off.";
export const DEFAULT_MAX_TURNS = 50;
const VALID_EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);

function defaultGrokBinaryCandidates() {
  const binaryName = process.platform === "win32" ? "grok.exe" : "grok";
  return [
    process.env.GROK_BIN,
    process.env.GROK_BIN_DIR ? path.join(process.env.GROK_BIN_DIR, binaryName) : null,
    path.join(DEFAULT_GROK_BIN_DIR, binaryName)
  ].filter(Boolean);
}

export function resolveGrokCommand() {
  for (const candidate of defaultGrokBinaryCandidates()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "grok";
}

export function getGrokInstallDir() {
  const command = resolveGrokCommand();
  if (command !== "grok") {
    return path.dirname(command);
  }
  return DEFAULT_GROK_BIN_DIR;
}

export function getGrokAvailability() {
  const command = resolveGrokCommand();
  const availability = binaryAvailable(command, ["--version"]);
  return {
    ...availability,
    command,
    installDir: getGrokInstallDir()
  };
}

export function getGrokAuthStatus() {
  const result = runCommand(resolveGrokCommand(), ["models"]);
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (result.status === 0 && /logged in/i.test(output)) {
    return { authenticated: true, detail: output.split("\n")[0] };
  }
  if (fs.existsSync(AUTH_FILE)) {
    return { authenticated: true, detail: "Credentials found in ~/.grok/auth.json" };
  }
  return {
    authenticated: false,
    detail: output || "Not logged in. Run `grok login` or `/grok:setup`."
  };
}

export function getSessionRuntimeStatus() {
  const availability = getGrokAvailability();
  const auth = getGrokAuthStatus();
  const ready = availability.available && auth.authenticated;
  return {
    ready,
    label: ready ? "ready" : availability.available ? "needs authentication" : "grok not installed"
  };
}

export function normalizeEffort(effort) {
  if (effort == null) {
    return null;
  }
  const normalized = String(effort).trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (!VALID_EFFORTS.has(normalized)) {
    throw new Error(`Unsupported effort "${effort}". Use one of: low, medium, high, xhigh, max.`);
  }
  return normalized;
}

export function parseGrokJsonOutput(stdout) {
  const trimmed = String(stdout ?? "").trim();
  if (!trimmed) {
    throw new Error("Grok returned empty output.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Failed to parse Grok JSON output.");
  }
}

export function preparePromptFile(prompt) {
  const tempDir = createTempDir("grok-prompt-");
  const promptFile = path.join(tempDir, "prompt.txt");
  fs.writeFileSync(promptFile, prompt, "utf8");
  return {
    promptFile,
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

export function buildGrokArgs(cwd, options = {}) {
  const args = [];

  if (options.promptFile) {
    args.push("--prompt-file", options.promptFile);
  }

  args.push("--output-format", "json", "--cwd", cwd, "--max-turns", String(options.maxTurns ?? DEFAULT_MAX_TURNS));

  if (options.model) {
    args.push("-m", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }
  if (options.reasoningEffort) {
    args.push("--reasoning-effort", options.reasoningEffort);
  }

  if (options.write) {
    args.push("--always-approve");
  } else {
    args.push("--permission-mode", "plan");
  }

  if (options.resumeSessionId) {
    args.push("-r", options.resumeSessionId);
  } else if (options.continueLast) {
    args.push("-c");
  }

  return args;
}

export function runGrokTurn(cwd, options = {}) {
  let promptFile = options.promptFile ?? null;
  let cleanupPrompt = null;

  if (!promptFile && options.prompt) {
    const prepared = preparePromptFile(options.prompt);
    promptFile = prepared.promptFile;
    cleanupPrompt = prepared.cleanup;
  }

  const args = buildGrokArgs(cwd, { ...options, promptFile });
  options.onProgress?.({ message: "Starting Grok...", phase: "starting" });

  try {
    const result = runCommand(resolveGrokCommand(), args, {
      cwd,
      maxBuffer: 64 * 1024 * 1024
    });

    if (result.error) {
      throw result.error;
    }

    let parsed = null;
    let text = "";
    let sessionId = null;
    let stopReason = null;

    if (result.stdout.trim()) {
      try {
        parsed = parseGrokJsonOutput(result.stdout);
        text = parsed.text ?? "";
        sessionId = parsed.sessionId ?? null;
        stopReason = parsed.stopReason ?? null;
      } catch {
        text = result.stdout.trim();
      }
    }

    const stderr = (result.stderr || "").trim();
    const status = result.status ?? 1;

    options.onProgress?.({
      message: status === 0 ? "Grok finished." : `Grok failed with exit ${status}.`,
      phase: status === 0 ? "done" : "failed",
      sessionId
    });

    return {
      status,
      stdout: result.stdout,
      stderr,
      finalMessage: text || stderr,
      sessionId,
      stopReason,
      parsed,
      failureMessage: status === 0 ? "" : stderr || text || `Grok exited with status ${status}.`
    };
  } finally {
    cleanupPrompt?.();
  }
}

export function findLatestTaskSessionId(workspaceRoot, jobs) {
  const taskJobs = jobs
    .filter((job) => job.jobClass === "task" && job.threadId)
    .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  return taskJobs[0]?.threadId ?? null;
}