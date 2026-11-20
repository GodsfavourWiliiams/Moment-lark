"use client";

import { useCallback, useReducer, useRef } from "react";
import { initialWelcomeState, welcomeReducer } from "@/state/welcome";
import type { WelcomeDialog } from "@/types/welcome";

/** UI state only. No decoder, network request, or persistence is connected. */
export function useWelcome() {
  const [state, dispatch] = useReducer(welcomeReducer, initialWelcomeState);
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = useCallback(() => inputRef.current?.click(), []);
  const openDialog = useCallback(
    (dialog: WelcomeDialog) => dispatch({ type: "open-dialog", dialog }),
    [],
  );
  const openShortcuts = useCallback(
    () => openDialog("shortcuts"),
    [openDialog],
  );
  const closeDialog = useCallback(() => openDialog(null), [openDialog]);
  const selectFiles = useCallback((files: FileList) => {
    if (!files.length) return;
    if (files.length !== 1) {
      dispatch({
        type: "file-error",
        message: "Please choose one video at a time.",
      });
      return;
    }
    const file = files[0];
    if (!/\.(mp4|mov|webm)$/i.test(file.name)) {
      dispatch({
        type: "file-error",
        message: "Choose an MP4, MOV, or WebM video.",
      });
      return;
    }
    // Only file details are retained to demonstrate the selection UI.
    dispatch({
      type: "select-video",
      video: { name: file.name, size: file.size },
    });
  }, []);
  return {
    ...state,
    inputRef,
    openPicker,
    openDialog,
    openShortcuts,
    closeDialog,
    selectFiles,
  };
}
