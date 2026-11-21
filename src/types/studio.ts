import type { AnalysisSnapshot } from "./analysis";
export type SelectedVideo = { name: string; size: number };
export type StudioDialog = { kind: "shortcuts" } | null;
export type StudioState = {
  view: "import" | "analysis";
  selectedVideo: SelectedVideo | null;
  reading: boolean;
  awaitingAnalysis: boolean;
  dialog: StudioDialog;
  error: string | null;
  analysis: AnalysisSnapshot;
};
export type StudioAction =
  | { type: "start-analysis"; video: SelectedVideo }
  | { type: "video-ready" }
  | { type: "run-analysis" }
  | { type: "analysis-progress"; snapshot: AnalysisSnapshot }
  | { type: "return-to-import" }
  | { type: "open-dialog"; dialog: StudioDialog }
  | { type: "file-error"; message: string };
