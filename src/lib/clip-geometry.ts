import type { AspectRatio } from "@/types/editing";
type Size = { width: number; height: number };

const OUTPUT_SIZE: Record<Exclude<AspectRatio, "original">, Size> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};
export const PREVIEW_SIZE = { width: 1920, height: 1080 };

/** Original keeps the source resolution, regardless of its orientation. */
export function outputSize(aspect: AspectRatio, source: Size): Size {
  return aspect === "original"
    ? { width: source.width, height: source.height }
    : OUTPUT_SIZE[aspect];
}

export function mediaRect(
  source: Size,
  viewport: Size,
  fit: "contain" | "cover",
  cropX = 0.5,
) {
  const scale = (fit === "contain" ? Math.min : Math.max)(
    viewport.width / source.width,
    viewport.height / source.height,
  );
  const width = source.width * scale;
  const height = source.height * scale;
  return {
    width,
    height,
    left: (viewport.width - width) * cropX,
    top: (viewport.height - height) / 2,
  };
}

/** The preview shows the complete source; an optional guide marks the exported crop. */
export function previewGeometry(
  source: Size,
  aspect: AspectRatio,
  cropX: number,
  viewport = PREVIEW_SIZE,
) {
  const media = mediaRect(source, viewport, "contain");
  const crop = mediaRect(outputSize(aspect, source), media, "contain", cropX);
  return {
    media,
    crop: { ...crop, left: media.left + crop.left, top: media.top + crop.top },
  };
}
