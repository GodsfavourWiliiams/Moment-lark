import { fixtureState } from "./fixtures/editing";
import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { editingReducer } from "../src/state/editing";
import {
  queueClips,
  createManualClip,
  renderSignature,
  clipFilename,
} from "../src/lib/clip-queue";
import { exportReducer, exportSummary } from "../src/state/export";
import { createClipArchive } from "../src/lib/media/download-archive";
import type { ExportJob } from "../src/types/export";

test("duplicates are independent, kept, uniquely named, and undoable", () => {
  const state = editingReducer(fixtureState, {
    type: "duplicate",
    id: "2",
    newId: "copy",
  });
  const copy = state.document!.clips.at(-1)!;
  assert.equal(copy.status, "kept");
  assert.equal(copy.ordinal, 5);
  assert.notEqual(copy.captions, state.document!.clips[1].captions);
  assert.notEqual(clipFilename(copy), clipFilename(state.document!.clips[1]));
  assert.deepEqual(copy.origin, { kind: "suggestion", ordinal: 2 });
  assert.deepEqual(
    editingReducer(state, { type: "undo" }).document,
    fixtureState.document,
  );
  assert.equal(
    editingReducer(state, { type: "duplicate", id: "2", newId: "copy" }),
    state,
  );
});

test("manual clips preserve original framing and fit short source durations", () => {
  const document = {
    ...fixtureState.document,
    source: { ...fixtureState.document!.source, durationInFrames: 14 },
  };
  const clip = createManualClip(document, "manual");
  assert.equal(clip.outFrame, 14);
  assert.equal(clip.aspect, "original");
  assert.equal(clip.status, "unreviewed");
  assert.equal(clip.origin?.kind, "manual");
});

test("queue filters and sorts only kept clips without mutating timeline order", () => {
  const clips = fixtureState.document!.clips.map((clip) => ({
    ...clip,
    status: "kept" as const,
  }));
  clips[1].aspect = "9:16";
  assert.deepEqual(
    queueClips(clips, "9:16", "timeline").map((clip) => clip.id),
    ["2"],
  );
  assert.deepEqual(
    queueClips(clips, "all", "shortest").map((clip) => clip.id),
    ["4", "3", "1", "2"],
  );
  assert.deepEqual(
    clips.map((clip) => clip.id),
    ["1", "2", "3", "4"],
  );
  assert.equal(
    queueClips(fixtureState.document!.clips, "all", "timeline").length,
    1,
  );
});

test("completed export becomes stale after editing, but not after a queue decision", () => {
  const clip = fixtureState.document!.clips[0];
  assert.notEqual(
    renderSignature(clip),
    renderSignature({ ...clip, outFrame: clip.outFrame - 1 }),
  );
  assert.equal(
    renderSignature(clip),
    renderSignature({ ...clip, status: "unreviewed" }),
  );
});

test("export summary counts actual completion and excludes canceled progress", () => {
  const jobs: ExportJob[] = fixtureState
    .document!.clips.slice(0, 3)
    .map((clip) => ({
      id: clip.id,
      clip,
      source: fixtureState.document!.source,
      status: "queued",
      progress: 0,
      message: "",
      blob: null,
      url: null,
      filename: clipFilename(clip),
    }));
  let state = exportReducer(jobs, {
    type: "update",
    id: "1",
    patch: { status: "complete", progress: 1, blob: new Blob(["video"]) },
  });
  state = exportReducer(state, {
    type: "update",
    id: "2",
    patch: { status: "rendering", progress: 0.5 },
  });
  assert.deepEqual(exportSummary(state), {
    complete: 1,
    progress: 0.5,
    bytes: 5,
  });
  state = exportReducer(state, {
    type: "update",
    id: "2",
    patch: { status: "canceled" },
  });
  assert.equal(exportSummary(state).progress, 1 / 3);
  const retried = exportReducer(state, { type: "enqueue", jobs: [jobs[1]] });
  assert.equal(retried.length, 3);
  assert.equal(retried.find((job) => job.id === "1")?.status, "complete");
});

test("ZIP download preserves every finished file and its contents", async () => {
  const blob = await createClipArchive([
    { filename: "clip-1.mp4", blob: new Blob(["first render"]) },
    { filename: "clip-2.mp4", blob: new Blob(["second render"]) },
  ]);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.deepEqual(Object.keys(files), ["clip-1.mp4", "clip-2.mp4"]);
  assert.equal(strFromU8(files["clip-2.mp4"]), "second render");
});
