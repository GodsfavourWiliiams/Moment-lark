"use client";
import { createContext } from "react";
import type { ClipDocument } from "@/types/editing";
import type { ExportJob } from "@/types/export";
export type ExportContextValue = {
  jobs: ExportJob[];
  busy: boolean;
  selection: string[] | null;
  select: (ids: string[] | null) => void;
  start: (clips: ClipDocument[]) => Promise<void>;
  cancel: (id: string) => void;
};
export const ExportContext = createContext<ExportContextValue | null>(null);
