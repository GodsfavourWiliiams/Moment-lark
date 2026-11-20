"use client";
import { useContext } from "react";
import { ExportContext } from "@/state/export-context";
export function useExportQueue() {
  const value = useContext(ExportContext);
  if (!value) throw new Error("useExportQueue requires ExportProvider");
  return value;
}
