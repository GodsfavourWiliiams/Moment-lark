import type { AnalysisSnapshot } from "../../types/analysis";
import type { ClipDocument, MediaSource } from "../../types/editing";
import type { AnalysisOptions } from "./options";
import type { ModelAvailability } from "./model-storage";
export type ModelPreparation = {
  models: ModelAvailability;
  speechReady: boolean;
  error?: string;
};
export type ModelDownloadApproval = { type: "approve-download"; id: string };
export type AnalysisRequest = {
  file: File;
  source: MediaSource;
  options: AnalysisOptions;
};
export type AnalysisEvent =
  | { type: "prepared"; preparation: ModelPreparation }
  | { type: "progress"; snapshot: AnalysisSnapshot }
  | { type: "complete"; clips: ClipDocument[]; timings: Record<string, number> }
  | { type: "error"; message: string };
