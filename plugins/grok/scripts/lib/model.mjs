import { resolveGrokCommand } from "./grok.mjs";
import { runCommand } from "./process.mjs";
import { getConfig } from "./state.mjs";

export const PLUGIN_DEFAULT_MODEL = "grok-composer-2.5-fast";
export const PLUGIN_MODEL_CONFIG_KEY = "defaultModel";

const MODEL_LABELS = {
  "grok-composer-2.5-fast": "Composer 2.5 Fast",
  "grok-build": "Grok Build"
};

export function formatModelLabel(modelId) {
  return MODEL_LABELS[modelId] ?? modelId;
}

export function listGrokModels() {
  const result = runCommand(resolveGrokCommand(), ["models"]);
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(output || `grok models exited with status ${result.status}.`);
  }

  const parsed = parseGrokModelsOutput(output);
  return {
    ...parsed,
    raw: output
  };
}

export function parseGrokModelsOutput(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let cliDefault = null;
  const models = [];

  for (const line of lines) {
    const defaultMatch = line.match(/^Default model:\s*(.+)$/i);
    if (defaultMatch) {
      cliDefault = defaultMatch[1].trim();
      continue;
    }

    const modelMatch = line.match(/^[-*]\s+(\S+?)(?:\s+\(default\))?$/);
    if (modelMatch) {
      const id = modelMatch[1];
      models.push({
        id,
        label: formatModelLabel(id),
        isCliDefault: /\(\s*default\s*\)/i.test(line) || line.startsWith("*")
      });
    }
  }

  return { cliDefault, models };
}

export function getPluginModelConfig(workspaceRoot) {
  const configured = getConfig(workspaceRoot)[PLUGIN_MODEL_CONFIG_KEY];
  if (configured == null || String(configured).trim() === "") {
    return null;
  }
  return String(configured).trim();
}

export function resolvePluginModel(workspaceRoot, explicitModel = null) {
  const normalizedExplicit = explicitModel == null ? null : String(explicitModel).trim();
  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  return getPluginModelConfig(workspaceRoot) ?? PLUGIN_DEFAULT_MODEL;
}

export function buildModelChoices(models, selectedModel) {
  return models.map((model) => {
    const isSelected = model.id === selectedModel;
    const suffix = isSelected ? " (Current)" : "";
    return {
      id: model.id,
      label: model.label,
      optionLabel: `${model.label}${suffix}`,
      isSelected,
      isCliDefault: model.isCliDefault
    };
  });
}

export function buildModelSnapshot(workspaceRoot, options = {}) {
  const availability = options.models ?? listGrokModels();
  const selectedModel = resolvePluginModel(workspaceRoot, options.explicitModel ?? null);
  const availableIds = new Set(availability.models.map((model) => model.id));
  const choices = buildModelChoices(availability.models, selectedModel);

  return {
    selectedModel,
    selectedLabel: formatModelLabel(selectedModel),
    pluginDefault: PLUGIN_DEFAULT_MODEL,
    cliDefault: availability.cliDefault,
    models: availability.models,
    choices,
    isValidSelection: availableIds.size === 0 || availableIds.has(selectedModel)
  };
}

export function validateModelSelection(modelId, availableModels) {
  const normalized = String(modelId ?? "").trim();
  if (!normalized) {
    throw new Error("Provide a model id.");
  }

  const availableIds = availableModels.map((model) => model.id);
  if (availableIds.length > 0 && !availableIds.includes(normalized)) {
    throw new Error(`Unknown model "${normalized}". Available: ${availableIds.join(", ")}`);
  }

  return normalized;
}