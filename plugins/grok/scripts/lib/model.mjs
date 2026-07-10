import { resolveGrokCommand } from "./grok.mjs";
import { runCommand } from "./process.mjs";
import { getConfig } from "./state.mjs";

// No hardcoded plugin default: when the workspace has no saved model, the plugin
// passes no `-m` and lets the Grok Build CLI pick its own default (grok-4.5 as of
// 2026-07). This auto-follows future xAI default changes instead of pinning an
// older model. Kept exported (as null) for back-compat with importers.
export const PLUGIN_DEFAULT_MODEL = null;
export const PLUGIN_MODEL_CONFIG_KEY = "defaultModel";

// Informational only: the model the Grok Build CLI falls back to when none is
// passed. Shown in `/grok:model` and `/grok:setup`; never forced via `-m`.
export const CLI_DEFAULT_MODEL_HINT = "grok-4.5";

const MODEL_LABELS = {
  "grok-4.5": "Grok 4.5",
  "grok-composer-2.5-fast": "Composer 2.5 Fast"
};

// Models offered by `/grok:model` without a live `grok models` refresh. Mirrors
// the current Grok Build CLI catalog. `grok-build` was removed upstream — the CLI
// now rejects `-m grok-build` with "unknown model id" — so it is no longer listed.
// A live `--refresh` still overrides this list from the CLI.
export const KNOWN_MODELS = [
  { id: "grok-4.5", label: "Grok 4.5" },
  { id: "grok-composer-2.5-fast", label: "Composer 2.5 Fast" }
];

const MODEL_ALIASES = {
  "4.5": "grok-4.5",
  "grok4.5": "grok-4.5",
  "grok-4.5": "grok-4.5",
  composer: "grok-composer-2.5-fast",
  "composer-2.5-fast": "grok-composer-2.5-fast",
  "grok-composer": "grok-composer-2.5-fast"
};

// Values that mean "clear the saved workspace model → follow the Grok CLI default".
const MODEL_CLEAR_VALUES = new Set(["none", "clear", "default", "unset", "cli", "auto"]);

export function isModelClearValue(value) {
  return MODEL_CLEAR_VALUES.has(String(value ?? "").trim().toLowerCase());
}

export function formatModelLabel(modelId) {
  return MODEL_LABELS[modelId] ?? modelId;
}

export function normalizeModelId(modelId) {
  const normalized = String(modelId ?? "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return MODEL_ALIASES[normalized] ?? String(modelId).trim();
}

export function getKnownModelsCatalog(cliDefault = null) {
  const effectiveDefault = cliDefault ?? CLI_DEFAULT_MODEL_HINT;
  return {
    cliDefault,
    models: KNOWN_MODELS.map((model) => ({
      ...model,
      isCliDefault: model.id === effectiveDefault
    }))
  };
}

export function listGrokModels(options = {}) {
  if (!options.refresh) {
    return {
      ...getKnownModelsCatalog(),
      raw: ""
    };
  }
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
  const trimmedExplicit = explicitModel == null ? "" : String(explicitModel).trim();
  if (trimmedExplicit) {
    return normalizeModelId(trimmedExplicit);
  }

  // No explicit model and no workspace override → null, so the CLI uses its default.
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
  const usingCliDefault = selectedModel == null;
  const availableIds = new Set(availability.models.map((model) => model.id));
  const effectiveCliDefault = availability.cliDefault ?? CLI_DEFAULT_MODEL_HINT;
  const choices = buildModelChoices(availability.models, selectedModel);

  return {
    selectedModel,
    usingCliDefault,
    selectedLabel: usingCliDefault
      ? `Grok CLI default (${formatModelLabel(effectiveCliDefault)})`
      : formatModelLabel(selectedModel),
    pluginDefault: PLUGIN_DEFAULT_MODEL,
    cliDefault: effectiveCliDefault,
    cliDefaultHint: CLI_DEFAULT_MODEL_HINT,
    models: availability.models,
    choices,
    isValidSelection: usingCliDefault || availableIds.size === 0 || availableIds.has(selectedModel)
  };
}

export function validateModelSelection(modelId, availableModels) {
  const normalized = normalizeModelId(modelId);
  if (!normalized) {
    throw new Error("Provide a model id.");
  }

  const availableIds = availableModels.map((model) => model.id);
  if (availableIds.length > 0 && !availableIds.includes(normalized)) {
    throw new Error(`Unknown model "${modelId}". Available: ${availableIds.join(", ")}`);
  }

  return normalized;
}