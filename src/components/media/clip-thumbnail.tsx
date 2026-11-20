import Image from "next/image";
import { Icon } from "@/components/ui";
import { outputSize } from "@/lib/clip-geometry";
import { durationLabel } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";

export function ClipThumbnail({
  clip,
  source,
  variant,
  onPreview,
  status,
}: {
  clip: ClipDocument;
  source: MediaSource;
  variant: "queue" | "export";
  onPreview?: () => void;
  status?: "rendering" | "error";
}) {
  const size = outputSize(clip.aspect, source);
  const portrait = size.height > size.width;
  const image =
    source.kind === "demo" && clip.aspect === "original"
      ? `/images/${variant}-2.jpg`
      : source.kind === "demo" && clip.ordinal <= 3
        ? `/images/${variant}-${clip.ordinal}.jpg`
        : clip.thumbnail;
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest shadow-lg ${portrait ? "w-28 sm:w-32" : "w-48 sm:w-56"}`}
      style={{ aspectRatio: `${size.width}/${size.height}` }}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="224px"
          unoptimized
          className={`object-cover ${status === "error" ? "grayscale opacity-50" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <Icon name="movie" size={36} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent" />
      <span className="absolute top-2 left-2 rounded bg-surface-container-lowest/90 px-1.5 py-0.5 font-code text-label-sm text-primary-fixed">
        {clip.aspect === "original" ? "Original" : clip.aspect}
      </span>
      <span className="absolute right-2 bottom-2 rounded bg-surface-container-lowest/90 px-1.5 py-0.5 font-code text-label-sm">
        {durationLabel(clip.outFrame - clip.inFrame, source.fps)}
      </span>
      {onPreview && (
        <button
          type="button"
          aria-label={`Preview Clip #${clip.ordinal}`}
          onClick={onPreview}
          className="absolute inset-0 m-auto flex size-11 items-center justify-center rounded-full bg-surface-container-highest/90 text-primary-fixed shadow-md transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Icon name="play" size={24} />
        </button>
      )}
      {status && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/60 backdrop-blur-[1px]">
          <Icon
            name={status === "rendering" ? "spinner" : "warning"}
            size={28}
            className={
              status === "rendering"
                ? "animate-spin text-primary-fixed motion-reduce:animate-none"
                : "text-error"
            }
          />
        </div>
      )}
    </div>
  );
}
