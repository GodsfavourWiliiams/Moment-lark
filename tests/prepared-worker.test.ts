import assert from "node:assert/strict";
import test from "node:test";
import {
  claimPreparedWorker,
  prepareAnalysisWorker,
} from "../src/lib/analysis/prepared-worker";
import type { ModelPreparation } from "../src/lib/analysis/protocol";

test("model preparation survives Start's form cleanup, but Cancel terminates it", () => {
  const original = globalThis.Worker;
  const instances: FakeWorker[] = [];
  class FakeWorker {
    terminated = false;
    messages: unknown[] = [];
    onmessage?: (event: { data: unknown }) => void;
    onerror?: () => void;
    constructor() {
      instances.push(this);
    }
    postMessage(message: unknown) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
  }
  globalThis.Worker = FakeWorker as unknown as typeof Worker;
  try {
    let preparation: ModelPreparation | undefined;
    const cleanup = prepareAnalysisWorker((value) => {
      preparation = value;
    });
    const worker = instances[0];
    assert.deepEqual(worker.messages, [{ type: "prepare" }]);
    worker.onmessage?.({
      data: {
        type: "prepared",
        preparation: {
          speechReady: true,
          models: { speech: "ready", sound: "missing", ranking: "missing" },
        },
      },
    });
    assert.equal(preparation?.speechReady, true);
    assert.equal(claimPreparedWorker(), worker);
    cleanup();
    assert.equal(
      worker.terminated,
      false,
      "form unmount must not kill the running analysis worker",
    );
    assert.equal(claimPreparedWorker(), undefined);
    worker.terminate();
    const cancel = prepareAnalysisWorker(() => {});
    cancel();
    assert.equal(instances[1].terminated, true);
    assert.equal(claimPreparedWorker(), undefined);
    const afterCrash = prepareAnalysisWorker(() => {});
    instances[2].onerror?.();
    assert.equal(instances[2].terminated, true);
    assert.equal(
      claimPreparedWorker(),
      undefined,
      "Start must create a fresh worker after a crash",
    );
    afterCrash();
  } finally {
    globalThis.Worker = original;
  }
});
