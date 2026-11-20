import { zip } from "fflate";

/** MP4 is already compressed; store entries without recompressing video data. */
export async function createClipArchive(
  files: { filename: string; blob: Blob }[],
): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files)
    entries[file.filename] = new Uint8Array(await file.blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    zip(entries, { level: 0 }, (error, data) => {
      if (error) reject(error);
      else
        resolve(new Blob([new Uint8Array(data)], { type: "application/zip" }));
    });
  });
}
