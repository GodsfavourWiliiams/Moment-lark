"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { DEMO_VIDEO } from "@/config/demo";
import { getStudioSection, type StudioSectionId } from "@/config/navigation";
import { useRouter } from "next/navigation";
import { useEditing } from "@/hooks/use-editing";
import { useAnalysisPreview } from "@/hooks/use-analysis-preview";
import { useStudioShortcuts } from "@/hooks/use-studio-shortcuts";
import { initialStudioState, studioReducer } from "@/state/studio";
import { StudioContext } from "@/state/studio-context";

export function StudioProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loadFile, loadDemo } = useEditing();
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTarget = useRef("choose-video-button");
  const previousView = useRef(state.view);
  const openPicker = useCallback(() => inputRef.current?.click(), []);
  const openShortcuts = useCallback(
    () => dispatch({ type: "open-dialog", dialog: { kind: "shortcuts" } }),
    [],
  );
  const closeDialog = useCallback(
    () => dispatch({ type: "open-dialog", dialog: null }),
    [],
  );
  const returnToImport = useCallback(
    () => dispatch({ type: "return-to-import" }),
    [],
  );
  const openSection = useCallback(
    (section: StudioSectionId) => {
      if (section === "import") dispatch({ type: "return-to-import" });
      else if (getStudioSection(section).available)
        router.push(getStudioSection(section).href);
      else
        dispatch({ type: "open-dialog", dialog: { kind: "section", section } });
    },
    [router],
  );
  const advance = useCallback(() => dispatch({ type: "advance-preview" }), []);
  useAnalysisPreview(
    state.view === "analysis" && state.progress < 100,
    advance,
  );
  useStudioShortcuts({
    openPicker,
    openShortcuts,
    dialogOpen: state.dialog !== null,
  });

  const startSample = useCallback(() => {
    loadDemo();
    returnTarget.current = "analyze-sample-button";
    dispatch({ type: "start-analysis", video: DEMO_VIDEO });
  }, [loadDemo]);
  const selectFiles = useCallback(
    async (files: FileList) => {
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
      try {
        if (!(await loadFile(file))) return;
        returnTarget.current = "choose-video-button";
        dispatch({
          type: "start-analysis",
          video: { name: file.name, size: file.size, source: "file" },
        });
      } catch (error) {
        dispatch({
          type: "file-error",
          message:
            error instanceof Error
              ? error.message
              : "Could not read this video.",
        });
      }
    },
    [loadFile],
  );

  useEffect(() => {
    if (state.view === previousView.current) return;
    const target =
      state.view === "analysis" ? "analysis-heading" : returnTarget.current;
    document.getElementById(target)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    previousView.current = state.view;
  }, [state.view]);

  return (
    <StudioContext.Provider
      value={{
        ...state,
        inputRef,
        openPicker,
        openShortcuts,
        closeDialog,
        returnToImport,
        openSection,
        startSample,
        selectFiles,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
