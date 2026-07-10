import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CLI_DEFAULT_MODEL_HINT,
  PLUGIN_DEFAULT_MODEL,
  buildModelChoices,
  getKnownModelsCatalog,
  isModelClearValue,
  normalizeModelId,
  parseGrokModelsOutput,
  resolvePluginModel
} from "../plugins/grok/scripts/lib/model.mjs";
import { renderModelReport } from "../plugins/grok/scripts/lib/render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPANION = path.join(ROOT, "plugins", "grok", "scripts", "grok-companion.mjs");

// Mirrors the real Grok Build CLI `grok models` output (grok-4.5 default since 2026-07-08).
const SAMPLE_MODELS_OUTPUT = `
You are logged in with grok.com.

Default model: grok-4.5

Available models:
  * grok-4.5 (default)
  - grok-composer-2.5-fast
`.trim();

test("parseGrokModelsOutput extracts CLI default and model ids", () => {
  const parsed = parseGrokModelsOutput(SAMPLE_MODELS_OUTPUT);

  assert.equal(parsed.cliDefault, "grok-4.5");
  assert.deepEqual(
    parsed.models.map((model) => model.id),
    ["grok-4.5", "grok-composer-2.5-fast"]
  );
  assert.equal(parsed.models[0].isCliDefault, true);
});

test("normalizeModelId resolves short aliases", () => {
  assert.equal(normalizeModelId("composer"), "grok-composer-2.5-fast");
  assert.equal(normalizeModelId("4.5"), "grok-4.5");
  assert.equal(normalizeModelId("grok-4.5"), "grok-4.5");
});

test("getKnownModelsCatalog avoids grok models subprocess and marks the CLI default", () => {
  const catalog = getKnownModelsCatalog();
  assert.equal(catalog.models.length, 2);
  const cliDefault = catalog.models.find((model) => model.isCliDefault);
  assert.equal(cliDefault.id, CLI_DEFAULT_MODEL_HINT);
});

test("resolvePluginModel normalizes explicit models and falls back to null (CLI default)", () => {
  assert.equal(resolvePluginModel("/tmp", "composer"), "grok-composer-2.5-fast");
  assert.equal(resolvePluginModel("/tmp", "grok-4.5"), "grok-4.5");
  // No explicit model and no workspace override → null so the CLI picks its own default.
  assert.equal(resolvePluginModel("/tmp", null), PLUGIN_DEFAULT_MODEL);
  assert.equal(PLUGIN_DEFAULT_MODEL, null);
});

test("isModelClearValue recognizes clear tokens only", () => {
  assert.equal(isModelClearValue("none"), true);
  assert.equal(isModelClearValue("clear"), true);
  assert.equal(isModelClearValue("auto"), true);
  assert.equal(isModelClearValue("grok-4.5"), false);
  assert.equal(isModelClearValue("composer"), false);
});

test("buildModelChoices marks the current selection", () => {
  const choices = buildModelChoices(
    [
      { id: "grok-4.5", label: "Grok 4.5", isCliDefault: true },
      { id: "grok-composer-2.5-fast", label: "Composer 2.5 Fast", isCliDefault: false }
    ],
    "grok-composer-2.5-fast"
  );

  assert.equal(choices[1].isSelected, true);
  assert.match(choices[1].optionLabel, /Current/);
});

test("renderModelReport lists available models and the CLI-default hint", () => {
  const rendered = renderModelReport({
    action: "show",
    changed: false,
    usingCliDefault: true,
    selectedModel: null,
    selectedLabel: "Grok CLI default (Grok 4.5)",
    cliDefault: "grok-4.5",
    choices: buildModelChoices(
      [
        { id: "grok-4.5", label: "Grok 4.5", isCliDefault: true },
        { id: "grok-composer-2.5-fast", label: "Composer 2.5 Fast", isCliDefault: false }
      ],
      null
    ),
    isValidSelection: true
  });

  assert.match(rendered, /Grok 4\.5/);
  assert.match(rendered, /Composer 2\.5 Fast/);
  assert.match(rendered, /follow the CLI default/);
});

test("renderModelReport describes a cleared workspace model", () => {
  const rendered = renderModelReport({
    action: "clear",
    changed: true,
    usingCliDefault: true,
    selectedModel: null,
    selectedLabel: "Grok CLI default (Grok 4.5)",
    cliDefault: "grok-4.5",
    choices: [],
    isValidSelection: true
  });

  assert.match(rendered, /Cleared/);
  assert.match(rendered, /grok-4\.5/);
});

test("grok-companion model exits successfully", () => {
  const result = spawnSync(process.execPath, [COMPANION, "model", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.action, "show");
  assert.equal(payload.pluginDefault, PLUGIN_DEFAULT_MODEL);
  assert.equal(typeof payload.usingCliDefault, "boolean");
  // With no saved workspace model, selectedModel is null (follow CLI default);
  // if a model is saved it is a non-empty string.
  assert.ok(
    payload.selectedModel === null ||
      (typeof payload.selectedModel === "string" && payload.selectedModel.length > 0)
  );
  assert.ok(Array.isArray(payload.choices));
  assert.equal(payload.choices.length, 2);
});
