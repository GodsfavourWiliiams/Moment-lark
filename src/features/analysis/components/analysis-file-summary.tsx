import { Icon } from "@/components/ui";
import type { SelectedVideo } from "@/types/studio";

export function AnalysisFileSummary({
  video,
  complete,
}: {
  video: SelectedVideo;
  complete: boolean;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 shadow-xl sm:flex-row sm:items-center">
      <div className="flex min-w-0 max-w-full items-center gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-fixed">
          <Icon name="video" size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full bg-primary-container ${!complete ? "motion-safe:animate-pulse" : ""}`}
            />
            <span className="text-label-sm tracking-wider text-primary-fixed uppercase">
              {complete ? "Preview Complete" : "Pipeline Running"}
            </span>
          </div>
          <p
            className="truncate text-body-md font-medium text-on-surface"
            title={video.name}
          >
            {complete ? "Selected:" : "Analyzing:"}{" "}
            <span className="font-code text-code-timecode font-semibold text-primary">
              {video.name}
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end rounded-lg bg-surface-container-lowest px-3 py-1.5 sm:self-auto">
        <span className="font-code text-code-timecode text-on-surface-variant">
          {video.source === "sample" ? "42:15" : "Local File"}
        </span>
        <span aria-hidden="true" className="text-outline">
          •
        </span>
        <span className="rounded-sm bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface">
          {video.source === "sample" ? "1080p FHD" : "UI Preview"}
        </span>
        <span aria-hidden="true" className="text-outline">
          •
        </span>
        <span className="flex items-center gap-1 text-label-sm text-tertiary-fixed-dim">
          <Icon name="bolt" size={14} />
          WebGPU
        </span>
      </div>
    </div>
  );
}
