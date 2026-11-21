import { MODEL_METADATA_ASSETS } from "./models";

/** Transformers.js custom cache: serve pinned speech metadata from our own
 * static assets; retain its normal cache keys and remote downloads for weights.
 * This does not proxy arbitrary URLs through our backend.
 */
export async function createModelAssetCache(
  origin: string,
  fetchFile: typeof fetch = fetch,
  storage: CacheStorage | undefined = globalThis.caches,
) {
  const metadata = new Map<string, string>(
    MODEL_METADATA_ASSETS.map((asset) => [
      asset.remote,
      new URL(asset.local, origin).href,
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
        return await browserCache?.match(key);
      } catch {
        return undefined;
      }
    },
    async put(key: string, response: Response): Promise<void> {
      try {
        await browserCache?.put(key, response);
      } catch {
        /* Storage limits must not prevent inference. */
      }
    },
  };
}
