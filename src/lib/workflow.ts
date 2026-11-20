import type { StudioSectionId } from "../config/navigation";
import type { EditingState } from "../types/editing";

/** A URL never starts a workflow step. Only session events can unlock it. */
export function canOpenSection(state: EditingState, section: StudioSectionId) {
  if (section === "import") return true;
  return Boolean(state.document && state.reached[section]);
}

export function workflowFallback(state: EditingState) {
  return canOpenSection(state, "suggestions") ? "/suggestions" : "/";
}
