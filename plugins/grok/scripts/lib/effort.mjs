import { getConfig } from "./state.mjs";
import { normalizeEffort } from "./grok.mjs";

export const PLUGIN_EFFORT_KEY = "defaultEffort";

export function getPluginEffortConfig(workspaceRoot) {
  const configured = getConfig(workspaceRoot)[PLUGIN_EFFORT_KEY];
  if (configured == null || String(configured).trim() === "") {
    return null;
  }
  try {
    return normalizeEffort(configured);
  } catch {
    return null;
  }
}

export function resolvePluginEffort(workspaceRoot, explicitEffort = null) {
  if (explicitEffort != null) {
    const normalized = String(explicitEffort).trim().toLowerCase();
    if (["none", "clear", "off", "default", ""].includes(normalized)) {
      return null; // explicitly no effort for this run (override workspace default)
    }
    return normalizeEffort(explicitEffort);
  }
  return getPluginEffortConfig(workspaceRoot);
}

export function normalizeEffortSetting(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || ["none", "clear", "off", "default", "unset"].includes(normalized)) {
    return null;
  }
  return normalizeEffort(normalized);
}

export function buildEffortSnapshot(workspaceRoot) {
  const effort = getPluginEffortConfig(workspaceRoot);
  return {
    effort,
    label: effort ? effort : "not set (Grok default)",
    pluginDefault: null,
  };
}
