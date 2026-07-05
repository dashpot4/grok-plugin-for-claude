import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { interpretGrokResult } from "../plugins/grok/scripts/lib/grok.mjs";
import { appendEnvVar, SESSION_ID_ENV } from "../plugins/grok/scripts/session-lifecycle-hook.mjs";

test("interpretGrokResult extracts text, sessionId, and stopReason from Grok JSON", () => {
  const r = interpretGrokResult({
    stdout: JSON.stringify({ text: "Done. Created hello.txt", sessionId: "abc-123", stopReason: "EndTurn" }),
    stderr: "",
    status: 0
  });

  assert.equal(r.finalMessage, "Done. Created hello.txt");
  assert.equal(r.sessionId, "abc-123");
  assert.equal(r.stopReason, "EndTurn");
  assert.equal(r.failureMessage, "");
});

test("interpretGrokResult keeps the answer even on a non-zero exit", () => {
  const r = interpretGrokResult({
    stdout: JSON.stringify({ text: "partial answer", stopReason: "MaxTurns" }),
    stderr: "some warning",
    status: 3
  });

  assert.equal(r.finalMessage, "partial answer");
  assert.equal(r.status, 3);
  assert.equal(r.failureMessage, "some warning");
});

test("interpretGrokResult falls back to stderr when text is empty", () => {
  const r = interpretGrokResult({
    stdout: JSON.stringify({ text: "", sessionId: "x" }),
    stderr: "boom",
    status: 1
  });

  assert.equal(r.finalMessage, "boom");
  assert.equal(r.failureMessage, "boom");
});

test("interpretGrokResult treats non-JSON stdout as the message", () => {
  const r = interpretGrokResult({ stdout: "plain text answer", stderr: "", status: 0 });

  assert.equal(r.finalMessage, "plain text answer");
  assert.equal(r.parsed, null);
});

test("appendEnvVar writes an export line to CLAUDE_ENV_FILE", () => {
  const envFile = path.join(os.tmpdir(), `grok-env-${process.pid}-${process.hrtime.bigint()}.sh`);
  const previous = process.env.CLAUDE_ENV_FILE;
  process.env.CLAUDE_ENV_FILE = envFile;

  try {
    appendEnvVar(SESSION_ID_ENV, "sess-123");
    const contents = fs.readFileSync(envFile, "utf8");
    assert.match(contents, /export GROK_COMPANION_SESSION_ID='sess-123'/);
  } finally {
    if (previous === undefined) {
      delete process.env.CLAUDE_ENV_FILE;
    } else {
      process.env.CLAUDE_ENV_FILE = previous;
    }
    if (fs.existsSync(envFile)) {
      fs.unlinkSync(envFile);
    }
  }
});

test("appendEnvVar is a no-op when CLAUDE_ENV_FILE is unset", () => {
  const previous = process.env.CLAUDE_ENV_FILE;
  delete process.env.CLAUDE_ENV_FILE;

  try {
    assert.doesNotThrow(() => appendEnvVar(SESSION_ID_ENV, "sess-xyz"));
  } finally {
    if (previous !== undefined) {
      process.env.CLAUDE_ENV_FILE = previous;
    }
  }
});
