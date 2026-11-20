import assert from "node:assert/strict";
import test from "node:test";
import { editingReducer, initialEditingState } from "../src/state/editing";
import { canOpenSection, workflowFallback } from "../src/lib/workflow";
import { STUDIO_NAVIGATION } from "../src/config/navigation";
import { fixtureState } from "./fixtures/editing";
import type { EditingState } from "../src/types/editing";

const visible = (state: EditingState) =>
  STUDIO_NAVIGATION.filter((item) => canOpenSection(state, item.id)).map(
    (item) => item.id,
  );
const loaded = () =>
  editingReducer(initialEditingState, {
    type: "load",
    document: {
      source: {
        ...fixtureState.document.source,
        id: "imported",
        url: "blob:local-video",
      },
      clips: [],
    },
  });
const analyzed = () =>
  editingReducer(loaded(), {
    type: "analysis-complete",
    sourceId: "imported",
    clips: fixtureState.document.clips,
  });

test("fresh sessions and imports cannot bypass analysis", () => {
  assert.equal(initialEditingState.document, null);
  assert.deepEqual(visible(initialEditingState), ["import"]);
  const state = loaded();
  assert.deepEqual(state.document?.clips, []);
  assert.deepEqual(visible(state), ["import"]);
  assert.equal(workflowFallback(state), "/");
  assert.equal(editingReducer(state, { type: "enter-editor", id: "1" }), state);
  assert.equal(
    editingReducer(state, { type: "prepare-export", ids: ["1"] }),
    state,
  );
});

test("only results for the active source unlock suggestions, with original framing and no pre-kept clips", () => {
  const state = loaded();
  assert.equal(
    editingReducer(state, {
      type: "analysis-complete",
      sourceId: "old-video",
      clips: fixtureState.document.clips,
    }),
    state,
  );
  const ready = analyzed();
  assert.deepEqual(visible(ready), ["import", "suggestions"]);
  assert.equal(workflowFallback(ready), "/suggestions");
  assert.ok(
    ready.document?.clips.every(
      (clip) => clip.status === "unreviewed" && clip.aspect === "original",
    ),
  );
  assert.deepEqual(
    visible(
      editingReducer(loaded(), {
        type: "analysis-complete",
        sourceId: "imported",
        clips: [],
      }),
    ),
    ["import", "suggestions"],
  );
});

test("editor is optional: keep a suggestion, review the queue, then initiate export", () => {
  let state = analyzed();
  assert.equal(
    editingReducer(state, { type: "enter-editor", id: "missing" }),
    state,
  );
  state = editingReducer(state, { type: "review", id: "1", status: "kept" });
  assert.deepEqual(visible(state), ["import", "suggestions", "clips"]);
  assert.equal(
    editingReducer(state, { type: "prepare-export", ids: [] }),
    state,
  );
  assert.equal(
    editingReducer(state, { type: "prepare-export", ids: ["2"] }),
    state,
  );
  state = editingReducer(state, { type: "prepare-export", ids: ["1"] });
  assert.deepEqual(visible(state), [
    "import",
    "suggestions",
    "clips",
    "export",
  ]);
  state = editingReducer(state, { type: "enter-editor", id: "1" });
  assert.deepEqual(visible(state), [
    "import",
    "suggestions",
    "editor",
    "clips",
    "export",
  ]);
});

test("reached steps survive queue removal for undo, but replacing or resetting a video locks all later routes", () => {
  let state = editingReducer(analyzed(), {
    type: "review",
    id: "1",
    status: "kept",
  });
  state = editingReducer(state, {
    type: "review",
    id: "1",
    status: "unreviewed",
  });
  assert.ok(canOpenSection(state, "clips"));
  state = editingReducer(state, { type: "undo" });
  assert.equal(state.document?.clips[0].status, "kept");
  state = editingReducer(state, {
    type: "load",
    document: { ...fixtureState.document, clips: [] },
  });
  assert.deepEqual(visible(state), ["import"]);
  assert.equal(state.past.length, 0);
  assert.equal(editingReducer(state, { type: "reset" }), initialEditingState);
});
