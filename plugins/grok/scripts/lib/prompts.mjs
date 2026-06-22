import fs from "node:fs";
import path from "node:path";

export function loadPromptTemplate(rootDir, name) {
  const filePath = path.join(rootDir, "prompts", `${name}.md`);
  return fs.readFileSync(filePath, "utf8");
}

export function interpolateTemplate(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => String(values[key] ?? ""));
}