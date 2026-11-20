export type StudioSection = "Suggestions" | "Editor" | "Clips" | "Export";
export type SelectedVideo = { name: string; size: number };
export type WelcomeDialog = "shortcuts" | "sample" | StudioSection | null;
export type WelcomeState = {
  selectedVideo: SelectedVideo | null;
  dialog: WelcomeDialog;
  error: string | null;
};
