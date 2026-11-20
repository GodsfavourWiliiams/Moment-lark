import type { StudioAction, StudioState } from "@/types/studio";

export const initialStudioState: StudioState = {
  view: "import",
  selectedVideo: null,
  progress: 72,
  dialog: null,
  error: null,
};

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case "start-analysis":
      return {
        ...state,
        view: "analysis",
        selectedVideo: action.video,
        progress: 72,
        error: null,
        dialog: null,
      };
    case "advance-preview":
      return state.view === "analysis" && state.progress < 100
        ? { ...state, progress: Math.min(state.progress + 2, 100) }
        : state;
    case "return-to-import":
      return { ...initialStudioState };
    case "open-dialog":
      return { ...state, dialog: action.dialog };
    case "file-error":
      return { ...state, error: action.message };
  }
}
