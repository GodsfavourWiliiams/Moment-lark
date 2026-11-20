"use client";

import { useContext } from "react";
import { StudioContext } from "@/state/studio-context";

export function useStudio() {
  const studio = useContext(StudioContext);
  if (!studio) throw new Error("useStudio must be used inside StudioProvider");
  return studio;
}
