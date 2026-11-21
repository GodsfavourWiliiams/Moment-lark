export function AnalysisProgress({
  progress,
  title,
  stage,
  remainingSeconds,
  detail,
  timing,
  complete,
}: {
  progress?: number;
  title: string;
  stage?: number;
  remainingSeconds?: number;
  detail?: string;
  timing?: string;
  complete: boolean;
}) {
  const percent = complete
    ? 100
    : progress === undefined
      ? undefined
      : Math.max(0, Math.min(100, progress));
  return (
    <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-container/20 px-2.5 py-0.5 text-label-sm tracking-wider text-primary-fixed uppercase">
              {complete
                ? "All Steps Complete"
                : stage
                  ? `Step ${stage} of 4`
                  : "4-Step Pipeline"}
            </span>
            <span className="text-label-sm text-on-surface-variant">
              Neural Analysis Runtime
            </span>
          </div>
          <h1
            id="analysis-heading"
            tabIndex={-1}
            className="text-headline-lg font-bold tracking-tight text-on-surface focus:outline-none"
          >
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-col gap-1 md:items-end">
          <div className="flex items-baseline gap-1.5">
            <span className="font-code text-headline-xl leading-none font-bold text-primary-fixed tabular-nums">
              {percent === undefined ? "—" : `${Math.round(percent)}%`}
            </span>
            <span className="text-label-md text-on-surface-variant">
              complete
            </span>
          </div>
          <span className="text-body-sm text-on-surface-variant">
            {complete
              ? "Opening Suggestions…"
              : remainingSeconds === undefined
                ? (detail ?? "Awaiting analysis")
                : `Estimated ~${Math.ceil(remainingSeconds)}s remaining`}
          </span>
          {timing && (
            <span className="text-body-sm text-on-surface-variant">
              {timing}
            </span>
          )}
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Video analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent === undefined ? "—" : `${Math.round(percent)}%`} — ${title}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-lowest p-0.5"
      >
        <div
          className="h-full rounded-full bg-primary-container shadow-nav transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${percent ?? 0}%`,
          }}
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {complete ? "Analysis complete. Opening Suggestions." : title}
      </p>
    </>
  );
}
