import assert from "node:assert/strict";
import test from "node:test";
import {
  MODEL_WEIGHT_ASSETS,
  RANK_MODEL_PROXY_PREFIX,
  RANK_MODEL_URL,
  RANK_MODEL_UPSTREAM_URL,
} from "../../src/lib/analysis/models";
import { modelWeightRoutes } from "../routes/model-weights";

test("streams only pinned model weights through a same-origin route", async () => {
  const requests: { url: string; method: string | undefined }[] = [];
  const fetchFile = (async (url: string, init?: RequestInit) => {
    requests.push({ url, method: init?.method });
    return new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-length": "3", "content-type": "text/html" },
    });
  }) as typeof fetch;
  const app = modelWeightRoutes(fetchFile);
  for (const asset of MODEL_WEIGHT_ASSETS) {
    const response = await app.request(`http://localhost${asset.local}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/octet-stream");
    assert.equal(response.headers.get("content-length"), "3");
    assert.match(response.headers.get("cache-control")!, /immutable/);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([1, 2, 3]));
  }
  assert.deepEqual(requests.map(({ url }) => url), MODEL_WEIGHT_ASSETS.map(({ remote }) => remote));

  for (const path of [
    "/onnx-community/whisper-base/resolve/main/onnx/encoder_model.onnx",
    "/onnx-community/whisper-base/resolve/27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c/onnx/other.onnx",
    "/https://evil.example/model.onnx",
  ]) {
    assert.equal((await app.request(`http://localhost${path}`)).status, 404);
  }
  assert.equal(requests.length, MODEL_WEIGHT_ASSETS.length);
});

test("Qwen requests keep their upstream cache URL and use the pinned relay", async () => {
  const file = "tensor-cache.json";
  const path = RANK_MODEL_PROXY_PREFIX + file;
  assert.equal(new URL(RANK_MODEL_URL + file).pathname, path);
  const requests: string[] = [];
  const app = modelWeightRoutes((async (url: string) => {
    requests.push(url);
    return new Response("{}", { headers: { "content-length": "2" } });
  }) as typeof fetch);
  const response = await app.request(`http://localhost${path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /application\/json/);
  assert.equal(await response.text(), "{}");
  assert.deepEqual(requests, [RANK_MODEL_UPSTREAM_URL + file]);
  assert.equal((await app.request(`http://localhost${RANK_MODEL_PROXY_PREFIX}../other.bin`)).status, 404);
  assert.equal((await app.request(`http://localhost${RANK_MODEL_PROXY_PREFIX}other.onnx`)).status, 404);
});

test("model route handles HEAD and upstream failures without serving error bodies as weights", async () => {
  const asset = MODEL_WEIGHT_ASSETS[0];
  const head = modelWeightRoutes((async (_url, init) => {
    assert.equal(init?.method, "HEAD");
    return new Response(null, { headers: { "content-length": "82468078" } });
  }) as typeof fetch);
  const response = await head.request(`http://localhost${asset.local}`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), "82468078");

  const unavailable = modelWeightRoutes((async () =>
    new Response("missing", { status: 404 })) as typeof fetch);
  const failed = await unavailable.request(`http://localhost${asset.local}`);
  assert.equal(failed.status, 502);
  assert.equal(failed.headers.get("content-type")?.includes("octet-stream"), false);
});
