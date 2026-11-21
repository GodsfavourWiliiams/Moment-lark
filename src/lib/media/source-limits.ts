/** Local testing policy; separate from the server-managed guest allowance. */
export const MAX_LOCAL_VIDEO_MINUTES = 90;
export const MAX_LOCAL_VIDEO_SECONDS = MAX_LOCAL_VIDEO_MINUTES * 60;

export function validateSourceDuration(durationSeconds: number): void {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The video's duration could not be read.");
  }
  if (durationSeconds > MAX_LOCAL_VIDEO_SECONDS) {
    throw new Error(
      `Choose a video up to ${MAX_LOCAL_VIDEO_MINUTES} minutes (1 hour 30 minutes) long.`,
    );
  }
}
