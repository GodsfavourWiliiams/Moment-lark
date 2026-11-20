import { Icon } from "@/components/ui";
import { durationLabel } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";
export function QueueSummary({
  clips,
  source,
}: {
  clips: ClipDocument[];
  source: MediaSource;
}) {
  return (
    <section className="relative flex flex-col justify-between gap-space-md overflow-hidden rounded-xl bg-surface-container-low p-space-lg lg:flex-row lg:items-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-primary-container/5 blur-3xl"
      />
      <div className="z-10 flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-label-sm tracking-wider text-primary-fixed uppercase">
            <span className="size-1.5 rounded-full bg-primary-container" />
            {clips.length ? "Queue Armed" : "Queue Empty"}
          </span>
          <span>Review Kept Clips</span>
          <span aria-hidden="true">•</span>
          <span
            className="max-w-full truncate rounded bg-surface-container px-2 py-0.5 font-code text-code-timecode"
            title={source.name}
          >
            {source.name}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-space-md">
          <h1 className="text-headline-lg">
            {clips.length} Clip{clips.length === 1 ? "" : "s"} Kept from Session
          </h1>
          <p className="text-headline-md font-normal text-on-surface-variant">
            Total duration:{" "}
            <strong className="font-code text-primary">
              {durationLabel(
                clips.reduce(
                  (total, clip) => total + clip.outFrame - clip.inFrame,
                  0,
                ),
                source.fps,
              )}
            </strong>
          </p>
        </div>
      </div>
      <div className="z-10 flex shrink-0 flex-wrap gap-space-lg">
        <div className="flex items-center gap-3 rounded-lg bg-surface-container px-3 py-2">
          <div className="flex flex-col">
            <span className="text-label-sm text-on-surface-variant">
              Est. Render Load
            </span>
            <span className="font-code text-code-timecode">
              Device dependent
            </span>
          </div>
          <svg
            aria-hidden="true"
            className="h-6 w-12 text-primary-container"
            viewBox="0 0 48 24"
            fill="currentColor"
          >
            <rect x="2" y="14" width="6" height="8" rx="1" opacity=".3" />
            <rect x="12" y="8" width="6" height="14" rx="1" opacity=".6" />
            <rect x="22" y="11" width="6" height="11" rx="1" />
            <rect x="32" y="4" width="6" height="18" rx="1" opacity=".9" />
            <rect x="42" y="9" width="4" height="13" rx="1" opacity=".4" />
          </svg>
        </div>
        <div className="hidden items-center gap-2 rounded-lg bg-surface-container px-3 py-2 sm:flex">
          <Icon name="check" className="text-primary-fixed" />
          <div>
            <p className="text-label-sm text-on-surface-variant">
              Timeline Sync
            </p>
            <p className="text-label-md">Non-destructive</p>
          </div>
        </div>
      </div>
    </section>
  );
}
