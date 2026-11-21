import {
  RANK_LIBRARY_URL,
  RANK_MODEL_URL,
  SOUND_MODEL,
  SPEECH_MODEL,
} from "./models";

export const MODEL_CACHES = [
  "transformers-cache",
  "webllm/model",
  "webllm/config",
  "webllm/wasm",
] as const;
export type ModelCacheName = (typeof MODEL_CACHES)[number];
export const speechBase = `https://huggingface.co/${SPEECH_MODEL.id}/resolve/${SPEECH_MODEL.revision}/`;
export const soundBase = `https://huggingface.co/${SOUND_MODEL.id}/resolve/${SOUND_MODEL.revision}/`;
export const SPEECH_WEIGHTS = [
  speechBase + "onnx/encoder_model.onnx",
  speechBase + "onnx/decoder_model_merged_q4.onnx",
];
export const SOUND_WEIGHTS = [soundBase + "onnx/model_quantized.onnx"];
export const MODEL_NAMES = {
  speech: "Whisper Base (about 206 MB)",
  ranking: "Qwen2.5 1.5B (about 869 MB)",
  sound: "AudioSet AST (about 91 MB)",
};
export type ModelAvailability = Record<
  keyof typeof MODEL_NAMES,
  "ready" | "missing" | "unknown"
>;

/** Only transfer the exact pinned resources used by this app. */
export function isModelResource(
  cache: string,
  url: string,
): cache is ModelCacheName {
  if (cache === "transformers-cache")
    return [speechBase, soundBase].some(
      (base) =>
        url.startsWith(base) &&
        /^(?:onnx\/)?[\w.-]+\.(?:json|onnx|txt|model)$/.test(
          url.slice(base.length),
        ),
    );
  if (cache === "webllm/model" || cache === "webllm/config")
    return (
      url.startsWith(RANK_MODEL_URL) &&
      /^[\w.-]+\.(?:json|bin|model)$/.test(url.slice(RANK_MODEL_URL.length))
    );
  return cache === "webllm/wasm" && url === RANK_LIBRARY_URL;
}

/** Cache-only: no model loads, network requests, or new caches. */
export async function inspectModels(
  storage: CacheStorage | undefined = globalThis.caches,
): Promise<ModelAvailability> {
  const result: ModelAvailability = {
    speech: "unknown",
    ranking: "unknown",
    sound: "unknown",
  };
  if (!storage) return result;
  try {
    const names = await storage.keys();
    const existing = new Map<ModelCacheName, Cache>();
    const keys = new Map<ModelCacheName, Set<string>>();
    for (const name of MODEL_CACHES) {
      if (!names.includes(name)) {
        keys.set(name, new Set());
        continue;
      }
      const cache = await storage.open(name);
      existing.set(name, cache);
      keys.set(name, new Set((await cache.keys()).map((key) => key.url)));
    }
    const has = (cache: ModelCacheName, urls: string[]) =>
      urls.every((url) => keys.get(cache)?.has(url));
    result.speech = has("transformers-cache", SPEECH_WEIGHTS)
      ? "ready"
      : "missing";
    result.sound = has("transformers-cache", SOUND_WEIGHTS)
      ? "ready"
      : "missing";
    const manifest = await existing
      .get("webllm/model")
      ?.match(RANK_MODEL_URL + "tensor-cache.json");
    const config = await existing
      .get("webllm/config")
      ?.match(RANK_MODEL_URL + "mlc-chat-config.json");
    if (!manifest || !config) {
      result.ranking = "missing";
      return result;
    }
    const readSmallJSON = async (response: Response) => {
      const text = await response.text();
      if (text.length > 1_000_000) throw new Error("Unexpected model metadata");
      return JSON.parse(text);
    };
    const records: { dataPath: string }[] = (await readSmallJSON(manifest))
      .records;
    const tokenizerFiles: string[] = (await readSmallJSON(config))
      .tokenizer_files;
    if (
      !Array.isArray(records) ||
      !records.length ||
      !Array.isArray(tokenizerFiles) ||
      !tokenizerFiles.length
    )
      return result;
    // WebLLM loads one tokenizer, not every auxiliary file listed in the config.
    const tokenizer = tokenizerFiles.includes("tokenizer.json")
      ? "tokenizer.json"
      : tokenizerFiles.includes("tokenizer.model")
        ? "tokenizer.model"
        : undefined;
    if (!tokenizer) return result;
    const files = [...records.map((r) => r.dataPath), tokenizer];
    if (
      files.some(
        (file) =>
          typeof file !== "string" ||
          !isModelResource("webllm/model", RANK_MODEL_URL + file),
      )
    )
      return result;
    result.ranking =
      has(
        "webllm/model",
        files.map((file) => RANK_MODEL_URL + file),
      ) && has("webllm/wasm", [RANK_LIBRARY_URL])
        ? "ready"
        : "missing";
  } catch {
    /* Restricted or damaged storage cannot prove availability. */
  }
  return result;
}
