import type { StudioAction, StudioState } from "@/types/studio";
export const initialStudioState: StudioState = {
  view: "import",
  selectedVideo: null,
  reading: false,
  awaitingAnalysis: false,
  dialog: null,
  error: null,
  analysis: {},
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
        reading: true,
        awaitingAnalysis: false,
        analysis: {},
        error: null,
        dialog: null,
      };
    case "analysis-progress":
      return { ...state, analysis: action.snapshot };
    case "video-ready":
      return { ...state, reading: false, awaitingAnalysis: true };
    case "run-analysis":
      return { ...state, awaitingAnalysis: false, error: null };
    case "return-to-import":
      return { ...initialStudioState };
    case "open-dialog":
      return { ...state, dialog: action.dialog };
    case "file-error":
      return { ...state, reading: false, error: action.message };
  }
}
