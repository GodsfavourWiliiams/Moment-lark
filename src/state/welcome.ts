import type {
  SelectedVideo,
  WelcomeDialog,
  WelcomeState,
} from "@/types/welcome";

export const initialWelcomeState: WelcomeState = {
  selectedVideo: null,
  dialog: null,
  error: null,
};

type WelcomeAction =
  | { type: "select-video"; video: SelectedVideo }
  | { type: "open-dialog"; dialog: WelcomeDialog }
  | { type: "file-error"; message: string };

export function welcomeReducer(
  state: WelcomeState,
  action: WelcomeAction,
): WelcomeState {
  switch (action.type) {
    case "select-video":
      return { ...state, selectedVideo: action.video, error: null };
    case "open-dialog":
      return { ...state, dialog: action.dialog };
    case "file-error":
      return { ...state, error: action.message };
  }
}
