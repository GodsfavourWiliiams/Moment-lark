"use client";

import { useEffect } from "react";

export function useWelcomeShortcuts({
  openPicker,
  openShortcuts,
  dialogOpen,
}: {
  openPicker: () => void;
  openShortcuts: () => void;
  dialogOpen: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || dialogOpen) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, video, [role='textbox']"))
      )
        return;
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey
      ) {
        event.preventDefault();
        openShortcuts();
      }
      // Scope single-letter shortcuts to the focused import control (WCAG 2.1.4).
      if (
        event.key.toLowerCase() === "o" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        target instanceof HTMLElement &&
        target.closest("[data-import-zone]")
      ) {
        event.preventDefault();
        openPicker();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPicker, openShortcuts, dialogOpen]);
}
