"use client";
import { useContext } from "react";
import { EditingContext } from "@/state/editing-context";
export function useEditing() {
  const context = useContext(EditingContext);
  if (!context) throw new Error("useEditing requires EditingProvider");
  return context;
}
