import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PLUGIN_DEFAULT_MODEL,
  buildModelChoices,
  buildModelSnapshot,
  parseGrokModelsOutput,
  resolvePluginModel
} from "../plugins/grok/scripts/lib/model.mjs";
import { renderModelReport } from "../plugins/grok/scripts/lib/render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPANION = path.join(ROOT, "plugins", "grok", "scripts", "grok-companion.mjs");

const SAMPLE_MODELS_OUTPUT = `
You are logged in with grok.com.

Default model: grok-composer-2.5-fast

Available models:
  - grok-build
  * grok-composer-2.5-fast (default)
`.trim();

test("parseGrokModelsOutput extracts CLI default and model ids", () => {
  const parsed = parseGrokModelsOutput(SAMPLE_MODELS_OUTPUT);

  assert.equal(parsed.cliDefault, "grok-composer-2.5-fast");
  assert.deepEqual(
    parsed.models.map((model) => model.id),
    ["grok-build", "grok-composer-2.5-fast"]
  );
  assert.equal(parsed.models[1].isCliDefault, true);
});

test("resolvePluginModel prefers explicit model then plugin default", () => {
  assert.equal(resolvePluginModel("/tmp", "grok-build"), "grok-build");
  assert.equal(resolvePluginModel("/tmp", null), PLUGIN_DEFAULT_MODEL);
});

test("buildModelChoices marks the current selection", () => {
  const choices = buildModelChoices(
    [
      { id: "grok-build", label: "Grok Build", isCliDefault: false },
      { id: "grok-composer-2.5-fast", label: "Composer 2.5 Fast", isCliDefault: true }
    ],
    "grok-composer-2.5-fast"
  );

  assert.equal(choices[1].isSelected, true);
  assert.match(choices[1].optionLabel, /Current/);
});

test("renderModelReport lists available models", () => {
  const rendered = renderModelReport({
    action: "show",
    changed: false,
    selectedModel: PLUGIN_DEFAULT_MODEL,
    selectedLabel: "Composer 2.5 Fast",
    pluginDefault: PLUGIN_DEFAULT_MODEL,
    cliDefault: PLUGIN_DEFAULT_MODEL,
    choices: buildModelChoices(
      [
        { id: "grok-build", label: "Grok Build", isCliDefault: false },
        { id: PLUGIN_DEFAULT_MODEL, label: "Composer 2.5 Fast", isCliDefault: true }
      ],
      PLUGIN_DEFAULT_MODEL
    ),
    isValidSelection: true
  });

  assert.match(rendered, /Composer 2.5 Fast/);
  assert.match(rendered, /grok-build/);
});

test("grok-companion model exits successfully", () => {
  const result = spawnSync(process.execPath, [COMPANION, "model", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.action, "show");
  assert.equal(payload.selectedModel, PLUGIN_DEFAULT_MODEL);
  assert.ok(Array.isArray(payload.choices));
  assert.ok(payload.choices.length >= 1);
});