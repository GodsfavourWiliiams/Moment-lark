"use client";

import { createContext, type RefObject } from "react";
import type { StudioSectionId } from "@/config/navigation";
import type { StudioState } from "@/types/studio";

export type StudioContextValue = StudioState & {
  inputRef: RefObject<HTMLInputElement | null>;
  openPicker: () => void;
  selectFiles: (files: FileList) => void;
  returnToImport: () => void;
  openShortcuts: () => void;
  closeDialog: () => void;
  openSection: (section: StudioSectionId) => void;
};

export const StudioContext = createContext<StudioContextValue | null>(null);
