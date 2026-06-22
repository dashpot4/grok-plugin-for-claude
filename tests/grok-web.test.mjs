import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderWebReport } from "../plugins/grok/scripts/lib/render.mjs";
import {
  PLUGIN_DEFAULT_DISABLE_WEB_SEARCH,
  buildWebSnapshot,
  normalizeWebSetting,
  resolveDisableWebSearch
} from "../plugins/grok/scripts/lib/web.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPANION = path.join(ROOT, "plugins", "grok", "scripts", "grok-companion.mjs");

test("resolveDisableWebSearch defaults to disabled web search", () => {
  assert.equal(resolveDisableWebSearch("/tmp", {}), PLUGIN_DEFAULT_DISABLE_WEB_SEARCH);
  assert.equal(resolveDisableWebSearch("/tmp", {}), true);
});

test("resolveDisableWebSearch honors per-run overrides", () => {
  assert.equal(resolveDisableWebSearch("/tmp", { web: true }), false);
  assert.equal(resolveDisableWebSearch("/tmp", { "no-web": true }), true);
  assert.equal(resolveDisableWebSearch("/tmp", { "enable-web-search": true }), false);
});

test("normalizeWebSetting maps on/off aliases", () => {
  assert.equal(normalizeWebSetting("on"), false);
  assert.equal(normalizeWebSetting("off"), true);
  assert.equal(normalizeWebSetting("enable"), false);
  assert.equal(normalizeWebSetting("disable"), true);
});

test("buildWebSnapshot reports disabled default", () => {
  const snapshot = buildWebSnapshot("/tmp");
  assert.equal(snapshot.disableWebSearch, true);
  assert.equal(snapshot.webSearchEnabled, false);
  assert.match(snapshot.label, /disabled/);
});

test("renderWebReport explains per-run overrides", () => {
  const rendered = renderWebReport({
    action: "show",
    changed: false,
    disableWebSearch: true,
    webSearchEnabled: false,
    label: "disabled by default"
  });

  assert.match(rendered, /--web/);
  assert.match(rendered, /--no-web/);
});

test("grok-companion web exits successfully", () => {
  const result = spawnSync(process.execPath, [COMPANION, "web", "--json"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.action, "show");
  assert.equal(payload.disableWebSearch, true);
  assert.equal(payload.webSearchEnabled, false);
});