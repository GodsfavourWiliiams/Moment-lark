import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const { MODEL_METADATA_ASSETS } = createRequire(import.meta.url)(
  "../src/lib/analysis/models.ts",
) as typeof import("../src/lib/analysis/models");

// Maintenance command: fetch the small pinned JSON assets, never model weights.
// These are committed with the site; normal builds do not contact Hugging Face.
for (const asset of MODEL_METADATA_ASSETS) {
  const destination = new URL(`../public${asset.local}`, import.meta.url);
  await mkdir(new URL(".", destination), { recursive: true });
  const response = await fetch(asset.remote, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${asset.local}: HTTP ${response.status}`);
  const text = await response.text();
  JSON.parse(text);
  await writeFile(destination, text);
  console.log(`${asset.local}: ${Buffer.byteLength(text)} bytes`);
}
