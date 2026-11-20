import { cropGuide } from "@/lib/clip-geometry";
import type { ClipDocument } from "@/types/editing";

export function CropGuides({
  clip,
  editor,
  grid,
}: {
  clip: ClipDocument;
  editor: boolean;
  grid: boolean;
}) {
  const width = (cropGuide(clip.aspect).width / 1920) * 100;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className={`absolute inset-y-0 shadow-[0_0_0_9999px_rgba(13,14,17,0.65)] ${editor ? "" : "my-4 rounded-lg"}`}
        style={{ width: `${width}%`, left: `${(100 - width) * clip.cropX}%` }}
      >
        {editor ? (
          <>
            {[
              "top-2 left-2",
              "top-2 right-2",
              "bottom-2 left-2",
              "bottom-2 right-2",
            ].map((position) => (
              <span
                key={position}
                className={`absolute size-3 rounded-sm bg-primary-container shadow-nav ${position}`}
              />
            ))}
            <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-container-lowest/80 px-2 py-0.5 text-[10px] tracking-wider text-primary-fixed">
              {clip.aspect}{" "}
              {clip.aspect === "9:16" ? "REELS / SHORTS SAFE" : "SAFE AREA"}
            </span>
          </>
        ) : (
          <>
            <div className="absolute inset-x-1 top-1 flex flex-wrap justify-between gap-1 rounded bg-surface-container-lowest/80 px-1 py-0.5 text-[10px]">
              <span className="tracking-wider text-primary-fixed">
                {clip.aspect} Vertical Crop
              </span>
              <span className="text-on-surface-variant">
                {clip.centered ? "Centered" : "Manual"}
              </span>
            </div>
            <div className="absolute inset-x-1 bottom-1 hidden justify-between gap-1 text-[10px] sm:flex">
              <span className="rounded bg-surface-container-high/90 p-1">
                Primary Speaker
              </span>
              <span className="rounded bg-surface-container-lowest/80 p-1">
                {clip.aspect === "9:16"
                  ? "1080×1920"
                  : clip.aspect === "1:1"
                    ? "1080×1080"
                    : "1920×1080"}
              </span>
            </div>
          </>
        )}
        {grid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="border border-white/20" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
