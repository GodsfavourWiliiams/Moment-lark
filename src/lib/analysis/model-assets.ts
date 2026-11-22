import { MODEL_METADATA_ASSETS, MODEL_WEIGHT_ASSETS } from "./models";

/** Serve model files from this origin while retaining portable, pinned
 * Hugging Face URLs as the browser's cache keys and model-pack identifiers. */
export async function createModelAssetCache(
  origin: string,
  fetchFile: typeof fetch = fetch,
  storage: CacheStorage | undefined = globalThis.caches,
) {
  const metadata = new Map<string, string>(
    MODEL_METADATA_ASSETS.map((asset) => [
      new URL(`/api/model-weights${new URL(asset.remote).pathname}`, origin).href,
      new URL(asset.local, origin).href,
    ]),
  );
  const upstreamKeys = new Map<string, string>(
    MODEL_WEIGHT_ASSETS.map((asset) => [
      new URL(asset.local, origin).href,
      asset.remote,
    ]),
  );
  let browserCache: Cache | undefined;
  try {
    browserCache = await storage?.open("transformers-cache");
  } catch {
    /* Private/restricted browser: downloads still work. */
  }
  return {
    async match(key: string): Promise<Response | undefined> {
      const asset = metadata.get(key);
      // Loading from the same origin also avoids previously cached CORS failures.
      if (asset) {
        const response = await fetchFile(asset);
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("json")
        )
          throw new Error(
            "Model setup files are missing from this deployment. Please reload and retry.",
          );
        return response;
      }
      try {
        const saved = await browserCache?.match(upstreamKeys.get(key) ?? key);
        if (saved) return saved;
      } catch {
        /* Restricted storage does not prevent library-managed downloads. */
      }
      return undefined;
    },
    async put(key: string, response: Response): Promise<void> {
      try {
        await browserCache?.put(upstreamKeys.get(key) ?? key, response);
      } catch {
        /* Storage limits must not prevent inference. */
      }
    },
  };
}
