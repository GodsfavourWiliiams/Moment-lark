/** Optional fields are populated by engine events, never by a simulated timer. */
export type AnalysisSnapshot = {
  detail?: string;
  timing?: string;
  soundScanSkipped?: boolean;
  audioLevel?: number;
  soundEvents?: number;
  stage?: 1 | 2 | 3 | 4;
  progress?: number;
  remainingSeconds?: number;
  stageResults?: Partial<Record<1 | 2 | 3 | 4, string>>;
  frame?: number;
  speechWpm?: number;
  speechLevel?: number;
  inflectionIndex?: number;
  faceSummary?: string;
};
