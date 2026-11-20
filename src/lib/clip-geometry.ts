import type { AspectRatio } from "@/types/editing";
export const OUTPUT_SIZE: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};
export function cropGuide(aspect: AspectRatio) {
  const target = OUTPUT_SIZE[aspect];
  return { width: (1080 * target.width) / target.height, height: 1080 };
}
