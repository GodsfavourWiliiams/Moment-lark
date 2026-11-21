import {
  RANK_LIBRARY_URL,
  RANK_REVISION,
  SOUND_MODEL,
  SPEECH_MODEL,
} from "./models";
import {
  isModelResource,
  MODEL_CACHES,
  type ModelCacheName,
} from "./model-storage";

const MAGIC = new TextEncoder().encode("MOMENTLARK-MODELS-1\n");
const VERSIONS = {
  speech: SPEECH_MODEL.revision,
  sound: SOUND_MODEL.revision,
  ranking: RANK_REVISION,
  library: RANK_LIBRARY_URL,
};
const MAX_ENTRY = 512 * 1024 * 1024;
const MAX_PACK = 3 * 1024 * 1024 * 1024;
const MAX_ENTRIES = 1024;
const MAX_HEADER = 8192;
const error = () =>
  new Error(
    "This is not a complete, compatible Moment Lark model pack. Export a new pack from the current app.",
  );
export type PackProgress = (message: string) => void;
export type PackWriter = {
  write: (data: Uint8Array<ArrayBuffer>) => Promise<void>;
};
type Entry = {
  cache: ModelCacheName;
  url: string;
  size: number;
  sha256: string;
};
const digest = async (bytes: ArrayBuffer) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const sizeBytes = (size: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, size);
  return bytes;
};
const header = async (writer: PackWriter, value: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (bytes.byteLength > MAX_HEADER) throw error();
  await writer.write(sizeBytes(bytes.byteLength));
  await writer.write(bytes);
};
function requireStorage(
  storage: CacheStorage | undefined,
): asserts storage is CacheStorage {
  if (!storage)
    throw new Error(
      "This browser does not allow model storage. Try a regular browser window with storage enabled.",
    );
}

/** Stream one cached file at a time. Never contacts a model host or reads video/session data. */
export async function exportModelPack(
  writer: PackWriter,
  signal: AbortSignal,
  progress: PackProgress,
  storage: CacheStorage | undefined = globalThis.caches,
) {
  requireStorage(storage);
  signal.throwIfAborted();
  const existing = await storage.keys();
  const resources: { cache: Cache; name: ModelCacheName; url: string }[] = [];
  for (const name of MODEL_CACHES) {
    if (!existing.includes(name)) continue;
    const cache = await storage.open(name);
    for (const key of await cache.keys())
      if (isModelResource(name, key.url))
        resources.push({ cache, name, url: key.url });
  }
  if (!resources.length)
    throw new Error(
      "No compatible model files are saved here. Export from the browser and site address where you previously ran analysis.",
    );
  if (resources.length > MAX_ENTRIES) throw error();
  await writer.write(MAGIC);
  await header(writer, VERSIONS);
  let total = 0;
  for (const [index, resource] of resources.entries()) {
    signal.throwIfAborted();
    progress(`Exporting model file ${index + 1} of ${resources.length}…`);
    const response = await resource.cache.match(resource.url);
    if (!response?.ok)
      throw new Error(
        "A saved model file disappeared. Please retry the export.",
      );
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_ENTRY) throw error();
    const buffer = await response.arrayBuffer();
    total += buffer.byteLength;
    if (
      !buffer.byteLength ||
      buffer.byteLength > MAX_ENTRY ||
      total > MAX_PACK - 10_000_000
    )
      throw error();
    const sha256 = await digest(buffer);
    signal.throwIfAborted();
    await header(writer, {
      cache: resource.name,
      url: resource.url,
      size: buffer.byteLength,
      sha256,
    } satisfies Entry);
    await writer.write(new Uint8Array(buffer));
  }
  await writer.write(sizeBytes(0));
  return resources.length;
}

/** Validate the entire pack before changing any live cache. Read one file at a
 * time, then stream verified Blob slices into CacheStorage. A cancelled copy may
 * retain valid files already copied; the next analysis reuses them normally.
 */
export async function importModelPack(
  file: Blob,
  signal: AbortSignal,
  progress: PackProgress,
  storage: CacheStorage | undefined = globalThis.caches,
) {
  requireStorage(storage);
  signal.throwIfAborted();
  if (file.size > MAX_PACK || file.size < MAGIC.length + 8) throw error();
  const magic = new Uint8Array(await file.slice(0, MAGIC.length).arrayBuffer());
  if (!magic.every((b, i) => b === MAGIC[i])) throw error();
  let offset = MAGIC.length;
  const readHeader = async (): Promise<unknown | null> => {
    signal.throwIfAborted();
    if (offset + 4 > file.size) throw error();
    const size = new DataView(
      await file.slice(offset, offset + 4).arrayBuffer(),
    ).getUint32(0);
    offset += 4;
    if (size === 0) return null;
    if (size > MAX_HEADER || offset + size > file.size) throw error();
    const text = await file.slice(offset, offset + size).text();
    offset += size;
    try {
      return JSON.parse(text);
    } catch {
      throw error();
    }
  };
  const versions = await readHeader();
  if (
    !versions ||
    typeof versions !== "object" ||
    Object.entries(VERSIONS).some(
      ([key, value]) => (versions as Record<string, unknown>)[key] !== value,
    )
  )
    throw error();
  const entries: (Entry & { offset: number })[] = [];
  const seen = new Set<string>();
  while (true) {
    const raw = await readHeader();
    if (raw === null) break;
    if (typeof raw !== "object" || Array.isArray(raw)) throw error();
    const entry = raw as Entry;
    if (
      typeof entry.cache !== "string" ||
      typeof entry.url !== "string" ||
      !isModelResource(entry.cache, entry.url) ||
      !Number.isSafeInteger(entry.size) ||
      entry.size <= 0 ||
      entry.size > MAX_ENTRY ||
      typeof entry.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw error();
    const key = entry.cache + "|" + entry.url;
    if (
      seen.has(key) ||
      entries.length >= MAX_ENTRIES ||
      offset + entry.size > file.size
    )
      throw error();
    seen.add(key);
    progress(`Checking model file ${entries.length + 1}…`);
    if (
      (await digest(
        await file.slice(offset, offset + entry.size).arrayBuffer(),
      )) !== entry.sha256
    )
      throw new Error(
        "The model pack contains a damaged file. Please export it again.",
      );
    entries.push({ ...entry, offset });
    offset += entry.size;
  }
  if (offset !== file.size || !entries.length) throw error();
  signal.throwIfAborted();
  progress("Model pack verified. Saving to this browser…");
  for (const [index, entry] of entries.entries()) {
    signal.throwIfAborted();
    const contentType = entry.url.endsWith(".json")
      ? "application/json"
      : entry.url.endsWith(".wasm")
        ? "application/wasm"
        : "application/octet-stream";
    const response = new Response(
      file.slice(entry.offset, entry.offset + entry.size),
      {
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(entry.size),
        },
      },
    );
    try {
      await (await storage.open(entry.cache)).put(entry.url, response);
    } catch {
      throw new Error(
        "This browser could not save the model files. Check available storage and browser privacy settings. Files already imported can still be reused.",
      );
    }
    progress(`Imported ${index + 1} of ${entries.length} model files…`);
  }
  return entries.length;
}
