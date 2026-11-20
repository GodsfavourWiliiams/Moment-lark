"use client";
import type { ReactNode } from "react";
import { useEditing } from "@/hooks/use-editing";
import { useExportController } from "@/hooks/use-export-controller";
import { ExportContext } from "@/state/export-context";
import type { MediaSource } from "@/types/editing";
export function ExportProvider({ children }: { children: ReactNode }) {
  const { document } = useEditing();
  return (
    <SessionExportProvider key={document.source.id} source={document.source}>
      {children}
    </SessionExportProvider>
  );
}
function SessionExportProvider({
  source,
  children,
}: {
  source: MediaSource;
  children: ReactNode;
}) {
  const value = useExportController(source);
  return (
    <ExportContext.Provider value={value}>{children}</ExportContext.Provider>
  );
}
