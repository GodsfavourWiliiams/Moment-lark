import Link from "next/link";
import { Icon } from "@/components/ui";
import { getStudioSection, editorHref } from "@/config/navigation";
import type { ClipDocument } from "@/types/editing";

export function EditorContextBar({
  clip,
  clips,
  onSettings,
}: {
  clip: ClipDocument;
  clips: ClipDocument[];
  onSettings: () => void;
}) {
  const index = clips.findIndex((item) => item.id === clip.id);
  const stepClass =
    "inline-flex min-h-7 items-center gap-1 rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant hover:text-on-surface";
  return (
    <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest px-space-lg py-space-sm shadow-sm">
      <div className="flex min-w-0 items-center gap-space-md">
        <Link
          href={getStudioSection("suggestions").href}
          aria-label="Back to Suggestions"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high"
        >
          <Icon name="back" size={18} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="shrink-0 rounded-full bg-primary-container px-2 py-0.5 text-label-sm font-bold tracking-wider text-on-primary-fixed uppercase">
              {clip.status === "kept"
                ? "Kept"
                : clip.status === "dismissed"
                  ? "Discarded"
                  : "In Review"}
            </span>
            <h1 className="text-headline-md font-semibold tracking-tight">
              Editing{" "}
              {clip.origin?.kind === "suggestion" ? "Suggestion" : "Clip"}{" "}
              {index + 1} of {clips.length}: &quot;
              {clip.title}&quot;
            </h1>
          </div>
          <p className="flex flex-wrap items-center gap-1 text-body-sm text-on-surface-variant">
            <Icon name="sparkles" size={14} className="text-primary-fixed" />
            {clip.score !== null ? (
              <>
                Detected viral hook score:{" "}
                <strong className="font-semibold text-on-surface">
                  {clip.score}/100
                </strong>{" "}
                •{" "}
              </>
            ) : null}
            Topic: {clip.topic}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg bg-surface-container-low p-1 shadow-inner">
          {index > 0 ? (
            <Link className={stepClass} href={editorHref(clips[index - 1].id)}>
              <Icon name="chevronLeft" size={14} />
              Prev
            </Link>
          ) : (
            <button disabled className={`${stepClass} opacity-40`}>
              <Icon name="chevronLeft" size={14} />
              Prev
            </button>
          )}
          <span className="px-2 font-code text-code-timecode font-semibold">
            {index + 1} / {clips.length}
          </span>
          {index < clips.length - 1 ? (
            <Link className={stepClass} href={editorHref(clips[index + 1].id)}>
              Next
              <Icon name="chevronRight" size={14} />
            </Link>
          ) : (
            <button disabled className={`${stepClass} opacity-40`}>
              Next
              <Icon name="chevronRight" size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onSettings}
          aria-haspopup="dialog"
          className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="sliders" size={16} />
          Studio Layout
        </button>
      </div>
    </div>
  );
}
