import type { AnalysisSnapshot } from "../../types/analysis";
import type { ClipDocument, MediaSource } from "../../types/editing";
export type AnalysisRequest = { file: File; source: MediaSource };
export type AnalysisEvent =
  | { type: "progress"; snapshot: AnalysisSnapshot }
  | { type: "complete"; clips: ClipDocument[] }
  | { type: "error"; message: string };
