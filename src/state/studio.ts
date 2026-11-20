import type { StudioAction, StudioState } from "@/types/studio";
export const initialStudioState: StudioState = {
  view: "import",
  selectedVideo: null,
  reading: false,
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
        reading: true,
        error: null,
        dialog: null,
      };
    case "video-ready":
      return { ...state, reading: false };
    case "return-to-import":
      return { ...initialStudioState };
    case "open-dialog":
      return { ...state, dialog: action.dialog };
    case "file-error":
      return { ...state, reading: false, error: action.message };
  }
}
