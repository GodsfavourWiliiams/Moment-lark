import type { AnalysisSnapshot } from "../../types/analysis";
import type { ClipDocument, MediaSource } from "../../types/editing";
import type { AnalysisOptions } from "./options";
export type AnalysisRequest = {
  file: File;
  source: MediaSource;
  options: AnalysisOptions;
};
export type AnalysisEvent =
  | { type: "progress"; snapshot: AnalysisSnapshot }
  | { type: "complete"; clips: ClipDocument[]; timings: Record<string, number> }
  | { type: "error"; message: string };
