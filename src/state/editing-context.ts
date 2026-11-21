"use client";
import { createContext, type Dispatch } from "react";
import type { EditingAction, EditingState, MediaSource } from "@/types/editing";
export type EditingContextValue = EditingState & {
  dispatch: Dispatch<EditingAction>;
  loadFile: (file: File) => Promise<MediaSource | null>;
  cancelLoad: () => void;
  resetSession: () => void;
};
export const EditingContext = createContext<EditingContextValue | null>(null);
