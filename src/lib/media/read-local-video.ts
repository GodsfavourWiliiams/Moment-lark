import type { EditingDocument } from "@/types/editing";
import {
  validateSourceDuration,
  validateSourceFileSize,
} from "./source-limits";

/** Inspect the local Blob without uploading or copying the complete recording into memory. */
export async function readLocalVideo(
  file: File,
  url: string,
): Promise<EditingDocument> {
  validateSourceFileSize(file.size);
  const { Input, BlobSource, ALL_FORMATS } = await import("mediabunny");
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track || !(await track.canDecode()))
      throw new Error(
        "This video's codec cannot be decoded in this browser. Try an H.264 MP4 or VP9 WebM.",
      );
    const duration = await input.computeDuration();
    validateSourceDuration(duration);
    const stats = await track.computePacketStats(100);
    const fps = Math.max(1, Math.round(stats.averagePacketRate || 30));
    const durationInFrames = Math.max(1, Math.floor(duration * fps));
    return {
      source: {
        id: crypto.randomUUID(),
        kind: "local",
        name: file.name,
        url,
        durationInFrames,
        fps,
        width: track.displayWidth,
        height: track.displayHeight,
      },
      clips: [],
    };
  } finally {
    input.dispose();
  }
}
