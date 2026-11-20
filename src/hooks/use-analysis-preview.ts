"use client";

import { useEffect } from "react";

/** Simulates only the supplied screen; replace with engine events during integration. */
export function useAnalysisPreview(running: boolean, advance: () => void) {
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(advance, 1200);
    return () => window.clearInterval(interval);
  }, [running, advance]);
}
