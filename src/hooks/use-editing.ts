"use client";
import { useContext } from "react";
import { EditingContext } from "@/state/editing-context";
export function useEditingSession() {
  const context = useContext(EditingContext);
  if (!context) throw new Error("useEditingSession requires EditingProvider");
  return context;
}

/** Active workspaces are mounted only after the workflow guard admits them. */
export function useEditing() {
  const context = useEditingSession();
  if (!context.document)
    throw new Error("This workspace requires an imported video");
  return { ...context, document: context.document };
}
