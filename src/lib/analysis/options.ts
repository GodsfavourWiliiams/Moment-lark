export type AnalysisOptions = {
  soundEvents: true;
  allowModelDownloads?: boolean;
};
export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = { soundEvents: true };
export const MIN_ANALYSIS_SECONDS = 6;

export function sourceGuidance(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < MIN_ANALYSIS_SECONDS)
    return {
      blocked: true,
      message:
        "This video is shorter than the minimum six-second suggestion. Choose a longer recording; no AI download or video slot will be used.",
    };
  if (seconds < 60)
    return {
      blocked: false,
      message:
        "This recording is already short. Analysis may find few or no useful cuts, and loading the models can take longer than the video itself.",
    };
  if (seconds >= 3600)
    return {
      blocked: false,
      message:
        "This is a long recording. Local analysis can take substantial time depending on your device. Keep this tab open; transcription speed will appear after the first few windows.",
    };
  return {
    blocked: false,
    message:
      "Your video and transcript stay on this device. Analysis includes speech, laughter, cheering and action sounds.",
  };
}

/** Estimate only the current stage; model loading and other stages are excluded. */
export function stageThroughput(
  processed: number,
  total: number,
  elapsedMs: number,
) {
  if (processed < 50 || elapsedMs <= 0) return undefined;
  const speed = processed / (elapsedMs / 1000);
  return {
    speed,
    remainingSeconds: Math.max(0, Math.ceil((total - processed) / speed)),
  };
}
