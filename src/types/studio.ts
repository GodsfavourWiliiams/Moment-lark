import type { StudioSectionId } from "@/config/navigation";

export type SelectedVideo = {
  name: string;
  size: number;
  source: "file" | "sample";
};
export type StudioDialog =
  | { kind: "shortcuts" }
  | { kind: "section"; section: StudioSectionId }
  | null;
export type StudioState = {
  view: "import" | "analysis";
  selectedVideo: SelectedVideo | null;
  progress: number;
  dialog: StudioDialog;
  error: string | null;
};
export type StudioAction =
  | { type: "start-analysis"; video: SelectedVideo }
  | { type: "advance-preview" }
  | { type: "return-to-import" }
  | { type: "open-dialog"; dialog: StudioDialog }
  | { type: "file-error"; message: string };
