"use client";
import { createContext, type Dispatch } from "react";
import type { EditingAction, EditingState } from "@/types/editing";
export type EditingContextValue = EditingState & {
  dispatch: Dispatch<EditingAction>;
  loadFile: (file: File) => Promise<boolean>;
  loadDemo: () => void;
};
export const EditingContext = createContext<EditingContextValue | null>(null);
