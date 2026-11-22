import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createModelAssetCache } from "../src/lib/analysis/model-assets";
import {
  MODEL_METADATA_ASSETS,
  MODEL_WEIGHT_ASSETS,
  SPEECH_MODEL,
} from "../src/lib/analysis/models";

const origin = "https://example.workers.dev";
const remote = `https://huggingface.co/${SPEECH_MODEL.id}/resolve/${SPEECH_MODEL.revision}/`;
const served = (url: string) =>
  new URL(`/api/model-weights${new URL(url).pathname}`, origin).href;

test("all pinned speech and sound JSON assets ship and are served from the site, without Hugging Face requests", async () => {
  const requested: string[] = [];
  const fetchFile = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.origin, origin);
    requested.push(url.pathname);
    const text = await readFile(
      new URL(`../public${url.pathname}`, import.meta.url),
      "utf8",
    );
    JSON.parse(text);
    return new Response(text, {
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  const cache = await createModelAssetCache(origin, fetchFile);
  for (const asset of MODEL_METADATA_ASSETS) {
    const response = await cache.match(served(asset.remote));
    assert.ok(response?.ok);
    assert.ok(await response.json());
  }
  assert.equal(requested.length, MODEL_METADATA_ASSETS.length);
});

test("model weights use same-origin downloads and retain portable upstream cache keys", async () => {
  const url = remote + "onnx/encoder_model.onnx";
  const entries = new Map<string, Response>([[url, new Response("weights")]]);
  const storage = {
    open: async () => ({
      match: async (key: string) => entries.get(key),
      put: async (key: string, value: Response) => {
        entries.set(key, value);
      },
    }),
  } as unknown as CacheStorage;
  const noFetch = (async () => {
    throw new Error("Unexpected network fetch");
  }) as typeof fetch;
  const cache = await createModelAssetCache(origin, noFetch, storage);
  assert.equal(await (await cache.match(served(url)))?.text(), "weights");
  assert.equal(await cache.match(served(remote + "missing.onnx")), undefined);
  const sound = MODEL_WEIGHT_ASSETS[2];
  await cache.put(served(sound.remote), new Response("new weights"));
  assert.ok(entries.has(sound.remote));
  assert.equal(
    await cache.match(
      served(remote.replace(SPEECH_MODEL.revision, "main") + "tokenizer.json"),
    ),
    undefined,
  );
});

test("blocked cache storage still allows same-origin metadata and missing assets are rejected", async () => {
  const blocked = {
    open: async () => {
      throw new Error("SecurityError");
    },
  } as unknown as CacheStorage;
  const cache = await createModelAssetCache(
    origin,
    (async () =>
      new Response("<html>not found</html>", { status: 404 })) as typeof fetch,
    blocked,
  );
  await assert.rejects(
    cache.match(served(remote + "tokenizer.json")),
    /missing from this deployment/,
  );
  assert.equal(await cache.match(served(remote + "onnx/model.onnx")), undefined);
});
