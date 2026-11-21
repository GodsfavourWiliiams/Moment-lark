"use client";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getStudioSection, type StudioSectionId } from "@/config/navigation";
import { useEditingSession } from "@/hooks/use-editing";
import { useWorkflow } from "@/hooks/use-workflow";
import { useStudioShortcuts } from "@/hooks/use-studio-shortcuts";
import { initialStudioState, studioReducer } from "@/state/studio";
import { StudioContext } from "@/state/studio-context";
import { runAnalysis } from "@/lib/analysis/run-analysis";
import { validateSourceFileSize } from "@/lib/media/source-limits";

export function StudioProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const {
    loadFile,
    cancelLoad,
    resetSession,
    reached,
    dispatch: editingDispatch,
  } = useEditingSession();
  const workflow = useWorkflow();
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const analysisController = useRef<AbortController | null>(null);
  useEffect(() => () => analysisController.current?.abort(), []);
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
  const returnToImport = useCallback(() => {
    request.current++;
    analysisController.current?.abort();
    if (reached.suggestions) cancelLoad();
    else resetSession();
    dispatch({ type: "return-to-import" });
  }, [cancelLoad, resetSession, reached.suggestions]);
  const openSection = (section: StudioSectionId) => {
    if (!workflow.canOpen(section)) return;
    router.push(getStudioSection(section).href);
  };
  useStudioShortcuts({
    openPicker,
    openShortcuts,
    dialogOpen: state.dialog !== null,
  });

  const selectFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return;
      const id = ++request.current;
      analysisController.current?.abort();
      const controller = new AbortController();
      analysisController.current = controller;
      cancelLoad();
      if (files.length !== 1 || !/\.(mp4|mov|webm)$/i.test(files[0].name)) {
        dispatch({ type: "return-to-import" });
        router.push("/");
        dispatch({
          type: "file-error",
          message: "Choose one MP4, MOV, or WebM video.",
        });
        return;
      }
      const file = files[0];
      // Reject oversized files before replacing the active project or opening analysis.
      try {
        validateSourceFileSize(file.size);
      } catch (error) {
        dispatch({ type: "return-to-import" });
        router.push("/");
        dispatch({
          type: "file-error",
          message:
            error instanceof Error
              ? error.message
              : "Could not read this video.",
        });
        return;
      }
      dispatch({
        type: "start-analysis",
        video: { name: file.name, size: file.size },
      });
      router.push("/");
      try {
        const source = await loadFile(file);
        if (!source || id !== request.current) return;
        dispatch({ type: "video-ready" });
        const clips = await runAnalysis(
          file,
          source,
          controller.signal,
          (snapshot) => {
            if (id === request.current)
              dispatch({ type: "analysis-progress", snapshot });
          },
        );
        if (id !== request.current || controller.signal.aborted) return;
        editingDispatch({
          type: "analysis-complete",
          sourceId: source.id,
          clips,
        });
      } catch (error) {
        if (id !== request.current) return;
        dispatch({
          type: "file-error",
          message:
            error instanceof Error
              ? error.message
              : "Could not read this video.",
        });
      }
    },
    [loadFile, cancelLoad, router, editingDispatch],
  );

  useEffect(() => {
    if (
      state.view !== "analysis" ||
      state.reading ||
      state.error ||
      !reached.suggestions
    )
      return;
    // Completion is an engine result for the current source, not a timer or percentage threshold.
    dispatch({ type: "return-to-import" });
    router.replace(getStudioSection("suggestions").href);
  }, [state.view, state.reading, state.error, reached.suggestions, router]);

  useEffect(() => {
    if (state.view === previousView.current) return;
    document
      .getElementById(
        state.view === "analysis" ? "analysis-heading" : "choose-video-button",
      )
      ?.focus({ preventScroll: true });
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
        selectFiles,
      }}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        hidden
        aria-label="Choose a video file"
        onChange={(event) => {
          if (event.currentTarget.files)
            void selectFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
    </StudioContext.Provider>
  );
}
