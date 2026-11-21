/** Local testing policy; separate from the server-managed guest allowance. */
// Decimal GB, matching the label shown to users.
export const MAX_LOCAL_VIDEO_SIZE_GB = 2;
export const MAX_LOCAL_VIDEO_BYTES = MAX_LOCAL_VIDEO_SIZE_GB * 1_000_000_000;

export function validateSourceFileSize(sizeBytes: number): void {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error("Choose a non-empty video file.");
  }
  if (sizeBytes > MAX_LOCAL_VIDEO_BYTES) {
    throw new Error(
      `Choose a video no larger than ${MAX_LOCAL_VIDEO_SIZE_GB} GB.`,
    );
  }
}

export function validateSourceDuration(durationSeconds: number): void {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The video's duration could not be read.");
  }
}
