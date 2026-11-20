import type { EditingDocument } from "@/types/editing";

/** Inspect the local Blob without uploading or copying the complete recording into memory. */
export async function readLocalVideo(
  file: File,
  url: string,
): Promise<EditingDocument> {
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
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error("The video's duration could not be read.");
    const stats = await track.computePacketStats(100);
    const fps = Math.max(1, Math.round(stats.averagePacketRate || 30));
    const durationInFrames = Math.max(1, Math.floor(duration * fps));
    const out = Math.min(durationInFrames, 80 * fps);
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
      clips: [
        {
          id: "1",
          ordinal: 1,
          title: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
          rationale:
            "Manual selection from your local recording. Adjust the trim handles to choose a moment.",
          topic: "Manual selection",
          score: null,
          thumbnail: null,
          status: "unreviewed",
          inFrame: 0,
          outFrame: out,
          originalIn: 0,
          originalOut: out,
          aspect: "original",
          cropX: 0.5,
          centered: true,
          captions: [],
        },
      ],
    };
  } finally {
    input.dispose();
  }
}
