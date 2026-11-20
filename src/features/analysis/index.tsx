import type { SelectedVideo } from "@/types/studio";
import { AnalysisActions } from "./components/analysis-actions";
import { AnalysisFileSummary } from "./components/analysis-file-summary";
import { AnalysisProgress } from "./components/analysis-progress";
import { AnalysisStages } from "./components/analysis-stages";
import { FramingTelemetry } from "./components/framing-telemetry";
import { RuntimeSummary } from "./components/runtime-summary";
import { ANALYSIS_STAGES } from "./data/preview";

type AnalysisViewProps = {
  video: SelectedVideo;
  progress: number;
  onCancel: () => void;
  onContinue: () => void;
};

/** Full workspace state within Import, not a route or blocking modal. */
export function AnalysisView({
  video,
  progress,
  onCancel,
  onContinue,
}: AnalysisViewProps) {
  const complete = progress >= 100;
  const stage = progress >= 96 ? 4 : 3;
  const title = complete
    ? "Clip suggestions are ready"
    : ANALYSIS_STAGES[stage - 1].title;
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
        <p
          id="analysis-demo-notice"
          className="self-start rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 text-body-sm text-on-surface-variant"
        >
          UI demo · Simulated progress and telemetry. No video processing.
        </p>
        <AnalysisFileSummary video={video} complete={complete} />
        <div className="flex flex-col gap-8 overflow-hidden rounded-xl bg-surface-container p-6 shadow-2xl sm:p-8">
          <AnalysisProgress progress={progress} title={title} stage={stage} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              <AnalysisStages stage={stage} complete={complete} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <FramingTelemetry />
            </div>
          </div>
          <AnalysisActions
            complete={complete}
            onCancel={onCancel}
            onContinue={onContinue}
          />
        </div>
        <RuntimeSummary />
      </div>
    </section>
  );
}
