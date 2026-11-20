"use client";
import { useEditingSession } from "./use-editing";
import { canOpenSection, workflowFallback } from "@/lib/workflow";
import type { StudioSectionId } from "@/config/navigation";

export function useWorkflow() {
  const state = useEditingSession();
  return {
    canOpen: (section: StudioSectionId) => canOpenSection(state, section),
    fallback: workflowFallback(state),
    enterEditor: (id: string) => state.dispatch({ type: "enter-editor", id }),
  };
}
