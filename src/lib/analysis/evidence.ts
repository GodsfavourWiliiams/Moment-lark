import { z } from "zod";
import type { ClipDocument, MediaSource } from "../../types/editing";

export type Evidence = {
  id: string;
  start: number;
  end: number;
  kind: "speech" | "sound";
  text: string;
};
export const rankedMomentsSchema = z
  .object({
    moments: z
      .array(
        z
          .object({
            startId: z.string().max(40),
            endId: z.string().max(40),
            title: z.string().min(1).max(100),
            reason: z.string().min(1).max(400),
            relevance: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(3),
  })
  .strict();
export type RankedMoment = z.infer<
  typeof rankedMomentsSchema
>["moments"][number];

/** Short, overlapping evidence batches bound the LLM's context independently of video length. */
export function evidenceBatches(evidence: Evidence[]) {
  const batches: Evidence[][] = [];
  let batch: Evidence[] = [];
  const bytes = (value: unknown) =>
    new TextEncoder().encode(JSON.stringify(value)).length;
  for (const original of [...evidence].sort((a, b) => a.start - b.start)) {
    // Limit only the ranker's excerpt, retaining full speech text for captions.
    // Count Unicode code points so truncation never splits a surrogate pair.
    const excerpt = Array.from(original.text).slice(0, 500);
    while (bytes(excerpt.join("")) > 2000) excerpt.pop();
    const item = { ...original, text: excerpt.join("") };
    const exceedsBudget = () =>
      bytes([...batch, item]) > 2600 || item.end - batch[0].start > 180;
    if (batch.length && exceedsBudget()) {
      batches.push(batch);
      batch = batch.slice(-2);
    }
    while (batch.length && exceedsBudget()) batch.shift();
    batch.push(item);
  }
  if (batch.length) batches.push(batch);
  return batches;
}

export function toClips(
  results: { moment: RankedMoment; evidence: Evidence[] }[],
  allEvidence: Evidence[],
  source: MediaSource,
): ClipDocument[] {
  const candidates: ClipDocument[] = [];
  for (const { moment, evidence } of results) {
    const start = evidence.find((e) => e.id === moment.startId);
    const end = evidence.find((e) => e.id === moment.endId);
    if (!start || !end || end.end <= start.start || end.start < start.start)
      continue;
    const inFrame = Math.max(0, Math.floor(start.start * source.fps));
    const outFrame = Math.min(
      source.durationInFrames,
      Math.ceil(end.end * source.fps),
    );
    const duration = (outFrame - inFrame) / source.fps;
    if (duration < 6 || duration > 120) continue;
    candidates.push({
      id: crypto.randomUUID(),
      ordinal: 0,
      title: moment.title,
      rationale: moment.reason,
      topic: "",
      score: moment.relevance,
      thumbnail: null,
      status: "unreviewed",
      inFrame,
      outFrame,
      originalIn: inFrame,
      originalOut: outFrame,
      aspect: "original",
      cropX: 0.5,
      centered: false,
      captions: allEvidence
        .filter(
          (e) =>
            e.kind === "speech" && e.end > start.start && e.start < end.end,
        )
        .map((e) => ({
          id: e.id,
          text: e.text,
          start: Math.max(inFrame, Math.floor(e.start * source.fps)),
          end: Math.min(outFrame, Math.ceil(e.end * source.fps)),
        }))
        .filter((c) => c.end > c.start),
    });
  }
  const kept: ClipDocument[] = [];
  for (const clip of candidates.sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  )) {
    if (
      kept.some((other) => {
        const overlap = Math.max(
          0,
          Math.min(clip.outFrame, other.outFrame) -
            Math.max(clip.inFrame, other.inFrame),
        );
        return (
          overlap /
            Math.min(
              clip.outFrame - clip.inFrame,
              other.outFrame - other.inFrame,
            ) >
          0.5
        );
      })
    )
      continue;
    const ordinal = kept.length + 1;
    kept.push({ ...clip, ordinal, origin: { kind: "suggestion", ordinal } });
    if (kept.length === 20) break;
  }
  return kept;
}

/** Ownership by midpoint keeps overlapping transcription windows from duplicating captions. */
export function speechEvidence(
  chunks: { text: string; timestamp: [number, number | null] }[],
  offset: number,
  windowEnd: number,
  ownStart: number,
  ownEnd: number,
  existing: Evidence[],
): Evidence[] {
  let lastEnd = existing.filter((e) => e.kind === "speech").at(-1)?.end ?? 0;
  const result: Evidence[] = [];
  for (const chunk of chunks) {
    const rawStart = offset + chunk.timestamp[0];
    const rawEnd =
      chunk.timestamp[1] === null ? windowEnd : offset + chunk.timestamp[1];
    const midpoint = (rawStart + rawEnd) / 2;
    if (
      !Number.isFinite(rawStart) ||
      !Number.isFinite(rawEnd) ||
      midpoint < ownStart ||
      midpoint >= ownEnd
    )
      continue;
    const start = Math.max(lastEnd, rawStart, 0),
      end = Math.min(windowEnd, rawEnd);
    const text = chunk.text.trim();
    if (!text || end <= start) continue;
    result.push({
      id: `s${existing.length + result.length}`,
      kind: "speech",
      start,
      end,
      text,
    });
    lastEnd = end;
  }
  return result;
}
