import type { ClipDocument, EditingDocument } from "../types/editing";
import type { QueueFilter, QueueSort } from "../types/export";

export function queueClips(
  clips: ClipDocument[],
  filter: QueueFilter,
  sort: QueueSort,
) {
  return clips
    .filter(
      (clip) =>
        clip.status === "kept" && (filter === "all" || clip.aspect === filter),
    )
    .sort((a, b) => {
      const duration = (clip: ClipDocument) => clip.outFrame - clip.inFrame;
      if (sort === "shortest")
        return duration(a) - duration(b) || a.ordinal - b.ordinal;
      if (sort === "longest")
        return duration(b) - duration(a) || a.ordinal - b.ordinal;
      if (sort === "score")
        return (b.score ?? -1) - (a.score ?? -1) || a.ordinal - b.ordinal;
      return a.inFrame - b.inFrame || a.ordinal - b.ordinal;
    });
}
export function createManualClip(
  document: EditingDocument,
  id: string,
): ClipDocument {
  const end = Math.min(
    document.source.durationInFrames,
    document.source.fps * 30,
  );
  return {
    id,
    ordinal: Math.max(0, ...document.clips.map((clip) => clip.ordinal)) + 1,
    title: "Untitled clip",
    rationale: "Manual selection from the original video.",
    topic: "Manual clip",
    score: null,
    thumbnail: null,
    status: "unreviewed",
    inFrame: 0,
    outFrame: end,
    originalIn: 0,
    originalOut: end,
    aspect: "original",
    cropX: 0.5,
    centered: true,
    captions: [],
    origin: { kind: "manual" },
  };
}
export function clipFilename(clip: ClipDocument) {
  const title =
    clip.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") ||
    "moment-lark";
  return `clip-${clip.ordinal}-${title}.mp4`;
}
export function formatBytes(bytes: number) {
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Only changes that affect pixels/audio invalidate a completed render. */
export function renderSignature(clip: ClipDocument) {
  return JSON.stringify([
    clip.title,
    clip.inFrame,
    clip.outFrame,
    clip.aspect,
    clip.cropX,
    clip.captions,
  ]);
}
