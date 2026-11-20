import { Icon } from "@/components/ui";
export function ExportSummary({
  total,
  complete,
  progress,
  active,
}: {
  total: number;
  complete: number;
  progress: number;
  active?: number;
}) {
  const percent = Math.round(progress * 100);
  return (
    <>
      <div className="flex flex-col justify-between gap-space-lg md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-label-sm font-semibold tracking-wider text-primary-fixed uppercase">
            <Icon name="lock" size={20} />
            100% In-Browser Rendering
          </p>
          <h1 className="text-headline-xl font-bold tracking-tight text-primary">
            Export &amp; Download
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Processing locally on your device <span aria-hidden="true">•</span>{" "}
            WebCodecs &amp; browser canvas pipeline
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-space-lg self-start rounded-xl bg-surface-container-low px-4 py-3 shadow-md">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase">
              Render Status
            </p>
            <p className="text-headline-md font-semibold text-primary">
              {complete} of {total} Clips Rendered
            </p>
          </div>
          <div className="relative flex size-12 items-center justify-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 36 36"
              className="size-full -rotate-90"
            >
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-surface-container-highest"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={`${percent} 100`}
                strokeLinecap="round"
                className="text-primary-container"
              />
            </svg>
            <span className="absolute font-code text-label-sm font-semibold">
              {percent}%
            </span>
          </div>
        </div>
      </div>
      <section
        aria-label="Export Queue Progress"
        className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-space-lg shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-label-md">
          <span className="flex items-center gap-1 font-medium text-primary">
            <span
              className={`size-2 rounded-full bg-primary-fixed ${active ? "animate-pulse motion-reduce:animate-none" : ""}`}
            />
            Export Queue Progress
          </span>
          <span className="font-code font-semibold text-primary-fixed">
            {percent}% Total Completed
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Overall export progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2.5 overflow-hidden rounded-full bg-surface-container-highest"
        >
          <div
            className="h-full rounded-full bg-primary-container transition-all motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-body-sm text-on-surface-variant">
          <span>
            {active
              ? `Active track encoding: Clip #${active}`
              : complete === total && total
                ? "All selected clips are ready"
                : "Ready when you are"}
          </span>
          <span>
            {active
              ? "Local video frame synthesis underway"
              : "Clip edits are preserved in this session"}
          </span>
        </div>
      </section>
    </>
  );
}
