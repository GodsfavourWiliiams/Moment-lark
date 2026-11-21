import assert from "node:assert/strict";
import test from "node:test";
import {
  exportModelPack,
  importModelPack,
} from "../src/lib/analysis/model-pack";
import {
  inspectModels,
  isModelResource,
  SPEECH_WEIGHTS,
  SOUND_WEIGHTS,
} from "../src/lib/analysis/model-storage";
import { RANK_LIBRARY_URL, RANK_MODEL_URL } from "../src/lib/analysis/models";

function memoryStorage() {
  const stores = new Map<string, Map<string, Response>>();
  let puts = 0;
  const storage = {
    keys: async () => [...stores.keys()],
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name)!;
      return {
        keys: async () => [...entries.keys()].map((url) => new Request(url)),
        match: async (key: string) => entries.get(key)?.clone(),
        put: async (key: string, response: Response) => {
          puts++;
          entries.set(key, response.clone());
        },
      };
    },
  } as unknown as CacheStorage;
  return { storage, stores, puts: () => puts };
}
async function makePack(storage: CacheStorage) {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  await exportModelPack(
    {
      write: async (chunk) => {
        chunks.push(chunk);
      },
    },
    new AbortController().signal,
    () => {},
    storage,
  );
  return new Blob(chunks);
}

test("model packs transfer bytes to original cache keys without unrelated site data", async () => {
  const source = memoryStorage();
  const cache = await source.storage.open("transformers-cache");
  await cache.put(SPEECH_WEIGHTS[0], new Response("model weights"));
  await cache.put(
    "https://example.com/api/session",
    new Response("private data"),
  );
  const file = await makePack(source.storage);
  const target = memoryStorage();
  assert.equal(
    await importModelPack(
      file,
      new AbortController().signal,
      () => {},
      target.storage,
    ),
    1,
  );
  assert.equal(
    await (
      await (
        await target.storage.open("transformers-cache")
      ).match(SPEECH_WEIGHTS[0])
    )?.text(),
    "model weights",
  );
  assert.equal(target.puts(), 1);
  assert.doesNotMatch(await file.text(), /private data|example.com/);
});

test("a corrupt, truncated, or incompatible pack is rejected before any cache writes", async () => {
  const source = memoryStorage();
  await (
    await source.storage.open("transformers-cache")
  ).put(SPEECH_WEIGHTS[0], new Response("model weights"));
  const file = await makePack(source.storage);
  const target = memoryStorage();
  const bytes = new Uint8Array(await file.arrayBuffer());
  bytes[bytes.length - 5] ^= 1;
  for (const broken of [
    new Blob([bytes]),
    file.slice(0, file.size - 4),
    new Blob(["not a model pack"]),
  ]) {
    await assert.rejects(
      importModelPack(
        broken,
        new AbortController().signal,
        () => {},
        target.storage,
      ),
    );
    assert.equal(target.puts(), 0);
  }
  const incompatible = new Blob([
    (await file.text()).replace("whisper", "whispex"),
  ]);
  await assert.rejects(
    importModelPack(
      incompatible,
      new AbortController().signal,
      () => {},
      target.storage,
    ),
  );
  assert.equal(target.puts(), 0);
});

test("export handles absent models, cancellation, and excludes foreign model revisions", async () => {
  const source = memoryStorage();
  await assert.rejects(makePack(source.storage), /No compatible model files/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    exportModelPack(
      { write: async () => {} },
      controller.signal,
      () => {},
      source.storage,
    ),
    { name: "AbortError" },
  );
  assert.equal(
    isModelResource(
      "transformers-cache",
      SPEECH_WEIGHTS[0].replace(/resolve\/[^/]+/, "resolve/main"),
    ),
    false,
  );
  assert.equal(
    isModelResource("webllm/wasm", "https://evil.example/payload.wasm"),
    false,
  );
  assert.equal(
    isModelResource("webllm/model", RANK_MODEL_URL + "../../file.bin"),
    false,
  );
});

test("cache-only preflight requires sound weights and every Qwen shard/tokenizer/runtime", async () => {
  const source = memoryStorage();
  assert.deepEqual(await inspectModels(source.storage), {
    speech: "missing",
    sound: "missing",
    ranking: "missing",
  });
  assert.equal(source.stores.size, 0);
  const cache = await source.storage.open("transformers-cache");
  for (const url of [...SPEECH_WEIGHTS, ...SOUND_WEIGHTS])
    await cache.put(url, new Response("weights"));
  const model = await source.storage.open("webllm/model");
  await model.put(
    RANK_MODEL_URL + "tensor-cache.json",
    Response.json({
      records: [
        { dataPath: "params_shard_0.bin" },
        { dataPath: "params_shard_1.bin" },
      ],
    }),
  );
  await model.put(
    RANK_MODEL_URL + "params_shard_0.bin",
    new Response("weights"),
  );
  await model.put(RANK_MODEL_URL + "tokenizer.json", Response.json({}));
  await (
    await source.storage.open("webllm/config")
  ).put(
    RANK_MODEL_URL + "mlc-chat-config.json",
    Response.json({
      tokenizer_files: [
        "tokenizer.json",
        "tokenizer_config.json",
        "tokenizer.model",
      ],
    }),
  );
  await (
    await source.storage.open("webllm/wasm")
  ).put(RANK_LIBRARY_URL, new Response("wasm"));
  assert.deepEqual(await inspectModels(source.storage), {
    speech: "ready",
    sound: "ready",
    ranking: "missing",
  });
  await model.put(
    RANK_MODEL_URL + "params_shard_1.bin",
    new Response("weights"),
  );
  assert.deepEqual(await inspectModels(source.storage), {
    speech: "ready",
    sound: "ready",
    ranking: "ready",
  });
  const target = memoryStorage();
  await importModelPack(
    await makePack(source.storage),
    new AbortController().signal,
    () => {},
    target.storage,
  );
  assert.deepEqual(await inspectModels(target.storage), {
    speech: "ready",
    sound: "ready",
    ranking: "ready",
  });
});

test("cancelled imports retain valid copied files and storage failures explain recovery", async () => {
  const source = memoryStorage();
  const cache = await source.storage.open("transformers-cache");
  for (const url of SPEECH_WEIGHTS)
    await cache.put(url, new Response("weights"));
  const pack = await makePack(source.storage);
  const target = memoryStorage();
  const controller = new AbortController();
  await assert.rejects(
    importModelPack(
      pack,
      controller.signal,
      (message) => {
        if (message.startsWith("Imported 1")) controller.abort();
      },
      target.storage,
    ),
    { name: "AbortError" },
  );
  assert.equal(target.puts(), 1);
  assert.equal(
    await (
      await (
        await target.storage.open("transformers-cache")
      ).match(SPEECH_WEIGHTS[0])
    )?.text(),
    "weights",
  );
  const full = {
    open: async () => ({
      put: async () => {
        throw new DOMException("Full", "QuotaExceededError");
      },
    }),
  } as unknown as CacheStorage;
  await assert.rejects(
    importModelPack(pack, new AbortController().signal, () => {}, full),
    /Check available storage/,
  );
});

test("unavailable storage is unknown, not a claim that models are absent", async () => {
  const blocked = {
    keys: async () => {
      throw new Error("SecurityError");
    },
  } as unknown as CacheStorage;
  assert.deepEqual(await inspectModels(blocked), {
    speech: "unknown",
    sound: "unknown",
    ranking: "unknown",
  });
});
