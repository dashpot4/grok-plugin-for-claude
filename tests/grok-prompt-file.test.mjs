import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildGrokArgs, preparePromptFile } from "../plugins/grok/scripts/lib/grok.mjs";
import { runCommand } from "../plugins/grok/scripts/lib/process.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ECHO_ARGS = path.join(ROOT, "tests", "fixtures", "echo-args.mjs");

test("buildGrokArgs adds --disable-web-search when requested", () => {
  const args = buildGrokArgs("C:\\workspace", { promptFile: "C:\\tmp\\p.txt", disableWebSearch: true });

  assert.ok(args.includes("--disable-web-search"));
});

test("buildGrokArgs uses --prompt-file and never -p", () => {
  const promptFile = path.join("C:\\tmp", "prompt.txt");
  const args = buildGrokArgs("C:\\workspace", { promptFile, write: false });

  assert.ok(args.includes("--prompt-file"));
  assert.equal(args[args.indexOf("--prompt-file") + 1], promptFile);
  assert.equal(args.indexOf("-p"), -1);
  assert.equal(args.indexOf("--single"), -1);
});

test("preparePromptFile writes UTF-8 prompt with parentheses and Korean", () => {
  const prompt = "한글 test (A) and (L269-286) more (parens)";
  const { promptFile, cleanup } = preparePromptFile(prompt);

  try {
    assert.equal(fs.readFileSync(promptFile, "utf8"), prompt);
  } finally {
    cleanup();
    assert.equal(fs.existsSync(promptFile), false);
  }
});

test("runCommand passes prompt file path without shell quoting loss", () => {
  const promptFile = path.join(ROOT, "tests", "fixtures", "sample-prompt.txt");
  const args = buildGrokArgs(ROOT, { promptFile, write: false, maxTurns: 4 });

  const result = runCommand(process.execPath, [ECHO_ARGS, ...args]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const echoed = JSON.parse(result.stdout);
  const echoedPromptFile = echoed[echoed.indexOf("--prompt-file") + 1];
  assert.equal(echoedPromptFile, promptFile);
  assert.equal(echoed.indexOf("-p"), -1);
});