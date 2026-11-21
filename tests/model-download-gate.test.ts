import assert from "node:assert/strict";
import test from "node:test";
import { ModelDownloadGate } from "../src/lib/analysis/model-download-gate";

test("missing model waits for its own approval, and previous approvals cannot authorize another model", async () => {
  const gate = new ModelDownloadGate();
  let id = "";
  let resumed = false;
  const first = gate
    .wait("sound", (request) => {
      id = request.id;
      assert.equal(request.model, "sound");
    })
    .then(() => {
      resumed = true;
    });
  await Promise.resolve();
  assert.equal(resumed, false);
  gate.approve("stale");
  await Promise.resolve();
  assert.equal(resumed, false);
  gate.approve(id);
  await first;
  assert.equal(resumed, true);
  const oldId = id;
  resumed = false;
  const second = gate
    .wait("ranking", (request) => {
      id = request.id;
    })
    .then(() => {
      resumed = true;
    });
  gate.approve(oldId);
  await Promise.resolve();
  assert.equal(resumed, false);
  gate.approve(id);
  await second;
  assert.equal(resumed, true);
});
