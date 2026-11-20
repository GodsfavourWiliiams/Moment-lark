import { useWorkflow } from "@/hooks/use-workflow";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { ClipThumbnail } from "@/components/media/clip-thumbnail";
import { editorHref } from "@/config/navigation";
import { outputSize } from "@/lib/clip-geometry";
import { formatBytes } from "@/lib/clip-queue";
import { durationLabel } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";
import type { ExportJob } from "@/types/export";
export function ExportCard({
  clip,
  source,
  job,
  busy,
  onStart,
  onCancel,
  onPreview,
}: {
  clip: ClipDocument;
  source: MediaSource;
  job?: ExportJob;
  busy: boolean;
  onStart: () => void;
  onCancel: () => void;
  onPreview: () => void;
}) {
  const status = job?.status ?? "idle";
  const size = outputSize(clip.aspect, source);
  const percent = Math.round((job?.progress ?? 0) * 100);
  const failed = status === "error" || status === "canceled";
  const text =
    status === "complete"
      ? "Ready to Download"
      : status === "rendering"
        ? "Rendering on this device…"
        : status === "queued"
          ? "Waiting in Render Queue"
          : status === "error"
            ? "Render Interrupted"
            : status === "canceled"
              ? "Render Canceled"
              : "Ready to Render";
  const workflow = useWorkflow();
  return (
    <article className="group flex w-full flex-col items-start justify-between gap-space-lg rounded-xl bg-surface-container-low p-space-lg shadow-md transition-colors hover:bg-surface-container lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-space-lg sm:flex-row sm:items-center">
        <ClipThumbnail
          clip={clip}
          source={source}
          variant="export"
          status={
            status === "rendering"
              ? "rendering"
              : status === "error"
                ? "error"
                : undefined
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-label-sm font-semibold ${status === "complete" ? "bg-primary-container text-on-primary-fixed" : failed ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-primary-fixed"}`}
            >
              <Icon
                name={
                  status === "complete" ? "check" : failed ? "warning" : "clock"
                }
                size={14}
              />
              {text}
            </span>
            <span className="rounded bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface-variant">
              {clip.aspect === "original"
                ? "Original Frame"
                : clip.aspect === "9:16"
                  ? "Vertical Story"
                  : "Square Cut"}
            </span>
          </div>
          <h2 className="text-headline-md font-semibold text-primary">
            Clip #{clip.ordinal}: {clip.title}
          </h2>
          {status === "rendering" ? (
            <>
              <div className="my-1 flex w-full max-w-md flex-col gap-1">
                <div
                  role="progressbar"
                  aria-label={`Clip ${clip.ordinal} render progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
                >
                  <div
                    className="h-full rounded-full bg-primary-container"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="font-code text-label-sm text-on-surface-variant">
                  {percent}% completed
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Encoding video frames. Processing speed depends on your device
                CPU/GPU.
              </p>
            </>
          ) : (
            <>
              {failed && (
                <p
                  role="alert"
                  className="my-1 rounded-lg bg-surface-container p-2 text-body-sm"
                >
                  {job?.message}
                </p>
              )}
              <div className="flex flex-wrap gap-x-2 gap-y-1 font-code text-body-sm text-on-surface-variant">
                <span className="font-medium text-on-surface">H.264 (MP4)</span>
                <span>•</span>
                <span>
                  {size.width} × {size.height}
                </span>
                {job?.blob && (
                  <>
                    <span>•</span>
                    <strong className="text-primary-fixed">
                      {formatBytes(job.blob.size)}
                    </strong>
                  </>
                )}
                <span>•</span>
                <span>
                  Duration:{" "}
                  {durationLabel(clip.outFrame - clip.inFrame, source.fps)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
                {clip.captions.find(
                  (cue) => cue.end > clip.inFrame && cue.start < clip.outFrame,
                )?.text ||
                  (clip.aspect === "original"
                    ? "Original frame preserved. Your source file stays unchanged."
                    : "Your chosen framing and clip edits are included.")}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
        {status === "complete" && job?.url ? (
          <>
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center gap-1 rounded-lg bg-surface-container-high px-3 py-2.5 text-label-md hover:bg-surface-bright"
            >
              <Icon name="play" size={18} />
              Preview
            </button>
            <a
              href={job.url}
              download={job.filename}
              className="flex items-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-label-md font-bold text-on-primary-fixed shadow-neon hover:brightness-105"
            >
              <Icon name="download" size={18} />
              Download MP4
            </a>
          </>
        ) : status === "rendering" || status === "queued" ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 text-label-md text-error hover:bg-error-container hover:text-on-error-container"
          >
            <Icon name="close" size={16} />
            Cancel Render
          </button>
        ) : (
          <>
            <Link
              href={editorHref(clip.id)}
              onClick={() => workflow.enterEditor(clip.id)}
              className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2.5 text-label-md hover:bg-surface-container-high"
            >
              <Icon name="sliders" size={18} />
              Re-edit Settings
            </Link>
            <button
              type="button"
              disabled={busy || !source.url}
              onClick={onStart}
              className="flex items-center gap-1 rounded-lg bg-surface-container-highest px-4 py-2.5 text-label-md font-semibold text-primary hover:bg-surface-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name={failed ? "history" : "download"} size={18} />
              {failed ? "Retry Render" : "Render MP4"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
