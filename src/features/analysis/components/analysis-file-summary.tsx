import { Icon } from "@/components/ui";
import { formatBytes } from "@/lib/clip-queue";
import { durationLabel } from "@/lib/timecode";
import type { SelectedVideo } from "@/types/studio";
import type { MediaSource } from "@/types/editing";
export function AnalysisFileSummary({
  video,
  source,
  reading,
  running,
}: {
  video: SelectedVideo;
  source: MediaSource | null;
  reading: boolean;
  running: boolean;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 shadow-xl sm:flex-row sm:items-center">
      <div className="flex min-w-0 max-w-full items-center gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-fixed">
          <Icon name="video" size={22} />
        </div>
        <div className="min-w-0">
          <span className="text-label-sm tracking-wider text-primary-fixed uppercase">
            {reading
              ? "Reading local file"
              : running
                ? "Pipeline Running"
                : "Awaiting Analysis"}
          </span>
          <p
            className="truncate font-code text-code-timecode font-semibold text-primary"
            title={video.name}
          >
            {video.name}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-code text-label-sm text-on-surface-variant">
        <span>{formatBytes(video.size)}</span>
        {source && (
          <>
            <span>• {durationLabel(source.durationInFrames, source.fps)}</span>
            <span>
              • {source.width} × {source.height}
            </span>
            <span>• {source.fps} fps</span>
          </>
        )}
      </div>
    </div>
  );
}
