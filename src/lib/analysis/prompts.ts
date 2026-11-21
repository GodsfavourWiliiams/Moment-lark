import type { Evidence } from "./evidence";

import compiled from "./prompts/compiled.json";
export const PROMPT_ID = compiled.highlights.id;
export const PROMPT_VERSION = compiled.highlights.version;
export const SCHEMA_VERSION = compiled.highlights.schema;
export const MOMENT_SYSTEM_PROMPT = compiled.highlights.text;
export const REPAIR_SYSTEM_PROMPT = compiled["json-repair"].text;
export function repairUserPrompt(
  invalid: string,
  evidence: Evidence[],
  errors: string[],
) {
  return JSON.stringify({
    schema: JSON.parse(MOMENT_JSON_SCHEMA),
    allowedIds: evidence.map((item) => item.id),
    validationErrors: errors.slice(0, 8),
    invalidResponse: Array.from(invalid).slice(0, 1200).join(""),
  });
}
export function momentUserPrompt(evidence: Evidence[]) {
  return `Select standalone moments from this JSON evidence. Return the required JSON object only.\n${JSON.stringify(evidence)}`;
}
export const MOMENT_JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    moments: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          startId: { type: "string" },
          endId: { type: "string" },
          title: { type: "string" },
          reason: { type: "string" },
          relevance: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["startId", "endId", "title", "reason", "relevance"],
        additionalProperties: false,
      },
    },
  },
  required: ["moments"],
  additionalProperties: false,
});
