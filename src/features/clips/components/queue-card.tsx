import Link from "next/link";
import { Icon } from "@/components/ui";
import { ClipThumbnail } from "@/components/media/clip-thumbnail";
import { editorHref } from "@/config/navigation";
import { outputSize } from "@/lib/clip-geometry";
import { durationLabel, timecode } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";
export function QueueCard({
  clip,
  source,
  selected,
  onSelect,
  onPreview,
  onDuplicate,
  onRemove,
}: {
  clip: ClipDocument;
  source: MediaSource;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const size = outputSize(clip.aspect, source);
  const original = clip.aspect === "original";
  const color = original ? "text-secondary" : "text-primary-fixed";
  const caption = clip.captions
    .filter((cue) => cue.end > clip.inFrame && cue.start < clip.outFrame)
    .map((cue) => cue.text)
    .join(" ");
  const origin =
    clip.origin?.kind === "manual" || source.kind === "local"
      ? "Manual Clip"
      : `From AI Suggestion #${clip.origin?.kind === "suggestion" ? clip.origin.ordinal : clip.ordinal}`;
  const adjusted =
    clip.inFrame !== clip.originalIn || clip.outFrame !== clip.originalOut;
  return (
    <article
      aria-labelledby={`queue-clip-${clip.id}`}
      className="group relative flex flex-col items-stretch gap-space-lg rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container lg:p-space-lg xl:flex-row xl:items-center"
    >
      <div
        aria-hidden="true"
        className={`absolute top-4 bottom-4 left-0 w-1 rounded-r ${original ? "bg-secondary" : "bg-primary-container"}`}
      />
      <div className="flex shrink-0 items-center justify-center">
        <ClipThumbnail
          clip={clip}
          source={source}
          variant="queue"
          onPreview={onPreview}
        />
      </div>
      <div className="flex min-w-0 grow flex-col justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded bg-surface-container-highest px-2 py-0.5 text-label-sm font-semibold ${color}`}
          >
            {origin}
            {adjusted ? " (Adjusted)" : ""}
          </span>
          <span className="rounded bg-surface-container-high px-2 py-0.5 font-code text-label-sm text-secondary">
            {size.width}×{size.height} • {source.fps} FPS
          </span>
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name={caption ? "captions" : "movie"} size={14} />
            {caption
              ? "Captions included"
              : clip.title
                ? "Title overlay included"
                : "Clean export"}
          </span>
        </div>
        <h2
          id={`queue-clip-${clip.id}`}
          className="text-headline-md font-semibold tracking-tight"
        >
          Clip #{clip.ordinal}: {clip.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-code text-code-timecode text-on-surface-variant">
          <span className="flex items-center gap-1.5 text-on-surface">
            <Icon name="clock" size={16} className={color} />
            {timecode(clip.inFrame, source.fps)}{" "}
            <span className="text-on-surface-variant/40">→</span>{" "}
            {timecode(clip.outFrame, source.fps)}
          </span>
          <span className={color}>
            Segment Span:{" "}
            {durationLabel(clip.outFrame - clip.inFrame, source.fps)}
          </span>
          <span className="text-body-sm">
            {original
              ? "Original frame"
              : `${clip.aspect} ${clip.aspect === "9:16" ? "Vertical" : "Square"}`}{" "}
            ({size.width}×{size.height})
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-surface-container-lowest/80 p-2 text-body-sm">
          <Icon
            name={caption ? "quote" : "movie"}
            size={16}
            className="mt-0.5 shrink-0 text-on-surface-variant"
          />
          <p
            className={`line-clamp-2 ${caption ? "italic" : "text-on-surface-variant"}`}
          >
            {caption ||
              (original
                ? "Full original camera frame preserved. Your source file stays unchanged."
                : "Custom framing applied. Your source file stays unchanged.")}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="relative h-2 overflow-hidden rounded-full bg-on-surface-variant/20"
        >
          <span
            className={`absolute inset-y-0 rounded-sm ${original ? "bg-secondary" : "bg-primary-container"}`}
            style={{
              left: `${(clip.inFrame / source.durationInFrames) * 100}%`,
              width: `${((clip.outFrame - clip.inFrame) / source.durationInFrames) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pt-1 xl:w-36 xl:flex-col xl:pt-0">
        <label className="flex min-h-8 items-center gap-2 text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select clip ${clip.ordinal} for export`}
            className="size-4 accent-primary-container"
          />
          {selected ? "Selected for export" : "Select for export"}
        </label>
        <button
          type="button"
          onClick={onPreview}
          className="flex min-h-9 grow items-center justify-center gap-1.5 rounded bg-surface-container-high px-3 py-2 text-label-md hover:bg-surface-bright xl:w-full"
        >
          <Icon name="play" size={18} className="text-primary-fixed" />
          Preview
        </button>
        <Link
          href={editorHref(clip.id)}
          className="flex min-h-9 grow items-center justify-center gap-1.5 rounded bg-surface-container px-3 py-2 text-label-md hover:bg-surface-container-high xl:w-full"
        >
          <Icon name="edit" size={18} />
          Edit Clip
        </Link>
        <div className="flex gap-1 xl:w-full">
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicate Clip #${clip.ordinal}`}
            title="Duplicate clip"
            className="flex min-h-9 min-w-11 flex-1 items-center justify-center rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <Icon name="copy" size={18} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove Clip #${clip.ordinal} from queue`}
            title="Remove from queue"
            className="flex min-h-9 min-w-11 flex-1 items-center justify-center rounded bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
