import assert from "node:assert/strict";
import test from "node:test";
import { editingReducer, initialEditingState } from "../src/state/editing";
import { durationLabel, parseTimecode, timecode } from "../src/lib/timecode";

test("trim handles cannot cross or leave the source", () => {
  let state = editingReducer(initialEditingState, {
    type: "patch",
    id: "2",
    patch: { inFrame: 9999999 },
  });
  let clip = state.document.clips[1];
  assert.equal(clip.inFrame, clip.outFrame - 1);
  assert.equal(clip.outFrame, 755 * 60);
  state = editingReducer(state, {
    type: "patch",
    id: "2",
    patch: { outFrame: -100 },
  });
  clip = state.document.clips[1];
  assert.equal(clip.outFrame, clip.inFrame + 1);
  state = editingReducer(state, {
    type: "patch",
    id: "2",
    patch: { inFrame: -5, outFrame: 9999999 },
  });
  assert.equal(state.document.clips[1].inFrame, 0);
  assert.equal(
    state.document.clips[1].outFrame,
    state.document.source.durationInFrames,
  );
});

test("keeping is idempotent and queued runtime reflects edits", () => {
  let state = editingReducer(initialEditingState, {
    type: "review",
    id: "2",
    status: "kept",
  });
  assert.equal(
    editingReducer(state, { type: "review", id: "2", status: "kept" }),
    state,
  );
  let kept = state.document.clips.filter((clip) => clip.status === "kept");
  assert.equal(kept.length, 2);
  assert.equal(
    durationLabel(
      kept.reduce((total, clip) => total + clip.outFrame - clip.inFrame, 0),
      60,
    ),
    "02:17",
  );
  state = editingReducer(state, {
    type: "patch",
    id: "2",
    patch: { outFrame: 735 * 60 },
  });
  kept = state.document.clips.filter((clip) => clip.status === "kept");
  assert.equal(
    durationLabel(
      kept.reduce((total, clip) => total + clip.outFrame - clip.inFrame, 0),
      60,
    ),
    "01:57",
  );
});

test("undo and redo preserve caption timing, crop and review decisions", () => {
  const edited = editingReducer(initialEditingState, {
    type: "patch",
    id: "2",
    patch: {
      inFrame: 690 * 60,
      aspect: "1:1",
      cropX: 0.2,
      title: "Edited hook",
    },
  });
  assert.deepEqual(
    edited.document.clips[1].captions,
    initialEditingState.document.clips[1].captions,
  );
  const dismissed = editingReducer(edited, {
    type: "review",
    id: "2",
    status: "dismissed",
  });
  const restored = editingReducer(dismissed, { type: "undo" });
  assert.deepEqual(restored.document, edited.document);
  assert.deepEqual(
    editingReducer(restored, { type: "redo" }).document,
    dismissed.document,
  );
  const changed = editingReducer(restored, {
    type: "patch",
    id: "1",
    patch: { title: "New history" },
  });
  assert.equal(changed.future.length, 0);
});

test("reset only restores trim boundaries; load clears stale undo history", () => {
  const edited = editingReducer(initialEditingState, {
    type: "patch",
    id: "2",
    patch: { inFrame: 700 * 60, aspect: "1:1" },
  });
  const reset = editingReducer(edited, { type: "reset-bounds", id: "2" });
  assert.equal(reset.document.clips[1].inFrame, 675 * 60);
  assert.equal(reset.document.clips[1].aspect, "1:1");
  assert.equal(
    editingReducer(reset, {
      type: "load",
      document: initialEditingState.document,
    }).past.length,
    0,
  );
});

test("source timecodes round-trip at 24, 30 and 60fps and reject invalid frames", () => {
  for (const fps of [24, 30, 60])
    for (const frame of [0, 1, fps - 1, fps * 702 + 18])
      assert.equal(parseTimecode(timecode(frame, fps, true), fps), frame);
  assert.equal(parseTimecode("00:11:42.60", 60), null);
  assert.equal(parseTimecode("00:61:00", 30), null);
  assert.equal(parseTimecode("not a timestamp", 30), null);
});
