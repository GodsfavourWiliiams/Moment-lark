import type { SelectedVideo } from "@/types/studio";
import type { MediaSource } from "@/types/editing";
import type { AnalysisSnapshot } from "@/types/analysis";
import { AnalysisFileSummary } from "./components/analysis-file-summary";
import { AnalysisProgress } from "./components/analysis-progress";
import { AnalysisStages } from "./components/analysis-stages";
import { AnalysisActions } from "./components/analysis-actions";
import { FramingTelemetry } from "./components/framing-telemetry";
import { ANALYSIS_STAGES } from "./data/stages";
import { AnalysisSetup } from "./components/analysis-setup";
import type { AnalysisOptions } from "@/lib/analysis/options";

/** The design stays in place; only engine results can populate its measurements. */
export function AnalysisView({
  video,
  source,
  reading,
  error,
  complete,
  snapshot = {},
  onCancel,
  awaitingAnalysis = false,
  onStart,
}: {
  video: SelectedVideo;
  source: MediaSource | null;
  reading: boolean;
  error: string | null;
  complete: boolean;
  snapshot?: AnalysisSnapshot;
  onCancel: () => void;
  awaitingAnalysis?: boolean;
  onStart?: (options: AnalysisOptions) => void;
}) {
  const title = error
    ? "Analysis needs your attention"
    : reading
      ? "Reading your video"
      : complete
        ? "Clip suggestions are ready"
        : snapshot.stage
          ? ANALYSIS_STAGES[snapshot.stage - 1].title
          : awaitingAnalysis
            ? "Ready to analyze your video"
            : "Preparing video analysis";
  return (
    <section
      aria-labelledby="analysis-heading"
      className="relative flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-hidden px-4 py-8 md:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-85 w-170 -translate-x-1/2 rounded-full bg-primary-container/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-12 bottom-8 h-55 w-80 rounded-full bg-secondary-container/15 blur-[100px]"
      />
      <div className="relative z-10 my-auto flex w-full max-w-4xl flex-col gap-6">
        <AnalysisFileSummary
          video={video}
          source={source}
          reading={reading}
          running={Boolean(snapshot.stage) && !complete && !error}
        />
        <div className="flex flex-col gap-8 overflow-hidden rounded-xl bg-surface-container p-6 shadow-2xl sm:p-8">
          <AnalysisProgress
            title={title}
            progress={snapshot.progress}
            stage={snapshot.stage}
            remainingSeconds={snapshot.remainingSeconds}
            detail={snapshot.detail}
            timing={snapshot.timing}
            complete={complete}
          />
          {error && (
            <p role="alert" className="text-body-sm text-error">
              {error}
            </p>
          )}
          {awaitingAnalysis && source && onStart && (
            <AnalysisSetup key={source.id} source={source} onStart={onStart} />
          )}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              <AnalysisStages
                stage={snapshot.stage}
                failed={Boolean(error)}
                complete={complete}
                results={snapshot.stageResults}
                faceSummary={snapshot.faceSummary}
              />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <FramingTelemetry
                key={source?.id ?? "pending"}
                source={source}
                snapshot={snapshot}
              />
            </div>
          </div>
          <AnalysisActions
            complete={complete}
            awaitingAnalysis={awaitingAnalysis}
            onCancel={onCancel}
          />
        </div>
      </div>
    </section>
  );
}
