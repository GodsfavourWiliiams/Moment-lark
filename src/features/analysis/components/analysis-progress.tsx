export function AnalysisProgress({
  progress,
  title,
  stage,
}: {
  progress: number;
  title: string;
  stage: number;
}) {
  const complete = progress === 100;
  return (
    <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-container/20 px-2.5 py-0.5 text-label-sm tracking-wider text-primary-fixed uppercase">
              {complete ? "All Steps Complete" : `Step ${stage} of 4`}
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
              {progress}%
            </span>
            <span className="text-label-md text-on-surface-variant">
              complete
            </span>
          </div>
          <span className="text-body-sm text-on-surface-variant">
            {complete
              ? "Demo ready to continue"
              : `Estimated ~${Math.ceil((100 - progress) * 0.6)}s remaining`}
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Simulated video analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={`${progress}% — ${title}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-lowest p-0.5"
      >
        <div
          className="h-full rounded-full bg-primary-container shadow-nav transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {complete
          ? "Analysis preview complete. Proceed to Suggestions is now available."
          : `Demo stage ${stage} of 4. ${title}.`}
      </p>
    </>
  );
}
