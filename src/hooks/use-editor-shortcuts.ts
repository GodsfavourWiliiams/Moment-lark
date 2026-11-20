"use client";
import { useEffect } from "react";
import type { ClipPlayer } from "./use-clip-player";
import type { ClipDocument, ClipPatch, MediaSource } from "@/types/editing";

export function useEditorShortcuts({
  player,
  clip,
  source,
  patch,
  keep,
  undo,
  redo,
}: {
  player: ClipPlayer;
  clip: ClipDocument;
  source: MediaSource;
  patch: (patch: ClipPatch) => void;
  keep: () => void;
  undo: () => void;
  redo: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        document.querySelector("dialog[open]")
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input,textarea,select,button,a,[role=slider]") ||
          target.isContentEditable)
      )
        return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "e") {
        event.preventDefault();
        keep();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Single-character shortcuts apply only while the editor workspace has focus.
      if (
        !(target instanceof HTMLElement) ||
        !target.closest("[data-editor-workspace]")
      )
        return;
      if (![" ", "i", "o", "j", "k", "l", "enter"].includes(key)) return;
      event.preventDefault();
      if (key === " ") player.toggle();
      if (key === "k") player.pause();
      if (key === "j") player.seek(player.frame - source.fps * 5);
      if (key === "l") player.seek(player.frame + source.fps * 5);
      if (key === "i" && player.frame < clip.outFrame)
        patch({ inFrame: player.frame });
      if (key === "o" && player.frame > clip.inFrame)
        patch({ outFrame: player.frame });
      if (key === "enter") keep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, clip, source, patch, keep, undo, redo]);
}
