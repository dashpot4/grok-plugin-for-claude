import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs } from "../plugins/grok/scripts/lib/args.mjs";
import { normalizeEffort } from "../plugins/grok/scripts/lib/grok.mjs";
import { renderSetupReport } from "../plugins/grok/scripts/lib/render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPANION = path.join(ROOT, "plugins", "grok", "scripts", "grok-companion.mjs");

test("parseArgs handles value and boolean flags", () => {
  const parsed = parseArgs(["task", "--background", "--model", "grok-build", "fix", "tests"], {
    valueOptions: ["model"],
    booleanOptions: ["background"]
  });

  assert.equal(parsed.options.background, true);
  assert.equal(parsed.options.model, "grok-build");
  assert.deepEqual(parsed.positionals, ["task", "fix", "tests"]);
});

test("normalizeEffort accepts supported values", () => {
  assert.equal(normalizeEffort("high"), "high");
  assert.throws(() => normalizeEffort("turbo"));
});

test("renderSetupReport mentions install guidance when grok is missing", () => {
  const rendered = renderSetupReport({
    ready: false,
    node: { available: true, detail: "v22.0.0" },
    grok: { available: false, detail: "not found" },
    auth: { authenticated: false, detail: "not logged in" },
    sessionRuntime: { ready: false, label: "grok not installed" },
    actionsTaken: []
  });

  assert.match(rendered, /Install Grok CLI/);
  assert.match(rendered, /needs attention/);
});

test("grok-companion setup exits successfully", () => {
  const result = spawnSync(process.execPath, [COMPANION, "setup"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Grok Setup/);
});