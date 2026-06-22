import { getConfig } from "./state.mjs";

export const PLUGIN_DISABLE_WEB_SEARCH_KEY = "disableWebSearch";
export const PLUGIN_DEFAULT_DISABLE_WEB_SEARCH = true;

export function getPluginDisableWebSearchConfig(workspaceRoot) {
  const configured = getConfig(workspaceRoot)[PLUGIN_DISABLE_WEB_SEARCH_KEY];
  if (configured === undefined || configured === null) {
    return PLUGIN_DEFAULT_DISABLE_WEB_SEARCH;
  }
  return Boolean(configured);
}

export function resolveDisableWebSearch(workspaceRoot, options = {}) {
  if (options["disable-web-search"] || options["no-web"]) {
    return true;
  }
  if (options["enable-web-search"] || options.web) {
    return false;
  }
  return getPluginDisableWebSearchConfig(workspaceRoot);
}

export function normalizeWebSetting(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    throw new Error('Provide "on" or "off" (or enable/disable).');
  }
  if (["on", "enable", "enabled", "true", "yes"].includes(normalized)) {
    return false;
  }
  if (["off", "disable", "disabled", "false", "no"].includes(normalized)) {
    return true;
  }
  throw new Error(`Unknown web setting "${value}". Use "on" or "off".`);
}

export function buildWebSnapshot(workspaceRoot) {
  const disableWebSearch = getPluginDisableWebSearchConfig(workspaceRoot);
  return {
    disableWebSearch,
    webSearchEnabled: !disableWebSearch,
    pluginDefault: PLUGIN_DEFAULT_DISABLE_WEB_SEARCH,
    label: disableWebSearch ? "disabled by default" : "enabled by default"
  };
}