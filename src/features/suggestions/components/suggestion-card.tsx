import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { editorHref } from "@/config/navigation";
import { durationLabel, timecode } from "@/lib/timecode";
import type { ClipDocument } from "@/types/editing";

export function SuggestionCard({
  clip,
  selected,
  fps,
  onPreview,
  onKeep,
  onDismiss,
}: {
  clip: ClipDocument;
  selected: boolean;
  fps: number;
  onPreview: () => void;
  onKeep: () => void;
  onDismiss: () => void;
}) {
  const kept = clip.status === "kept";
  const actionClass = `inline-flex min-h-8 items-center justify-center gap-1 rounded-lg px-space-sm py-1.5 text-label-sm transition-colors ${selected ? "bg-surface-container-highest hover:bg-surface-bright" : "bg-surface-container-high hover:bg-surface-container-highest"}`;
  return (
    <article
      aria-labelledby={`clip-title-${clip.id}`}
      className={`flex flex-col gap-space-sm rounded-xl p-space-md transition-colors ${selected ? "bg-surface-container-high shadow-xl ring-2 ring-primary-container" : "bg-surface-container shadow-sm hover:bg-surface-container-high"}`}
    >
      <div className="flex gap-space-md">
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview clip ${clip.ordinal}: ${clip.title}`}
          aria-pressed={selected}
          className={`relative w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest ${selected ? "h-28" : "h-24"}`}
        >
          {clip.thumbnail ? (
            <Image
              src={clip.thumbnail}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center text-primary-fixed">
              <Icon name="movie" size={32} />
            </span>
          )}
          {selected && clip.aspect !== "original" && (
            <span className="absolute inset-x-2 inset-y-1 rounded border border-primary-fixed/80" />
          )}
          <span
            className={`absolute right-1 bottom-1 rounded bg-surface-container-lowest/80 px-1 font-code text-label-sm ${selected ? "text-primary-fixed" : "text-on-surface"}`}
          >
            {durationLabel(clip.outFrame - clip.inFrame, fps)}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span
              className={`text-label-sm font-semibold tracking-wider uppercase ${selected ? "text-primary-fixed" : "text-on-surface-variant"}`}
            >
              Clip #{clip.ordinal}
              {selected && " • Selected"}
            </span>
            {kept ? (
              <span className="rounded bg-primary-container/20 px-1.5 py-0.5 text-label-sm text-primary-fixed">
                ✓ In Kept Queue
              </span>
            ) : (
              !selected && (
                <span className="font-code text-label-sm text-on-surface-variant">
                  {timecode(clip.inFrame, fps)} → {timecode(clip.outFrame, fps)}
                </span>
              )
            )}
          </div>
          <h2
            id={`clip-title-${clip.id}`}
            className="mt-1 text-body-lg leading-snug font-semibold text-on-surface"
          >
            {clip.title}
          </h2>
          {selected && (
            <div className="mt-1 flex flex-wrap items-center gap-1 font-code text-body-sm text-on-surface-variant">
              <span>
                {timecode(clip.inFrame, fps)} → {timecode(clip.outFrame, fps)}
              </span>
              <span>•</span>
              <span>{Math.round((clip.outFrame - clip.inFrame) / fps)}s</span>
            </div>
          )}
          <p
            className={`mt-2 rounded p-space-xs text-body-sm text-on-surface-variant ${selected ? "bg-surface-container" : "bg-surface-container-low"}`}
          >
            <span className="font-medium text-on-surface">Rationale:</span>{" "}
            {clip.rationale}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-space-xs">
        <div className="flex items-center gap-1">
          <button type="button" className={actionClass} onClick={onPreview}>
            <Icon
              name="play"
              size={16}
              className={selected ? "text-primary-fixed" : ""}
            />
            {selected ? "Re-Preview" : "Preview"}
          </button>
          <Link href={editorHref(clip.id)} className={actionClass}>
            <Icon name="edit" size={16} />
            Edit in Editor
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onKeep}
            aria-pressed={kept}
            aria-label={`${kept ? "Remove" : "Keep"} clip ${clip.ordinal}${kept ? " from kept queue" : ""}`}
            className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-space-md py-1.5 text-label-sm font-semibold transition-colors ${kept ? "bg-primary-container text-on-primary-fixed shadow-nav" : "bg-surface-container-highest text-on-surface hover:bg-primary-container hover:text-on-primary-fixed"}`}
          >
            <Icon name="check" size={16} />
            Keep Clip
          </button>
          <button
            type="button"
            aria-label={`Dismiss suggestion ${clip.ordinal}`}
            title="Dismiss suggestion"
            onClick={onDismiss}
            className={`flex size-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-bright hover:text-error ${selected ? "bg-surface-container-highest" : "bg-surface-container-high"}`}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
