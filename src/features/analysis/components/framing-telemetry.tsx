"use client";
import { useState } from "react";
import { Icon } from "@/components/ui";
import type { MediaSource } from "@/types/editing";
import type { AnalysisSnapshot } from "@/types/analysis";

export function FramingTelemetry({
  source,
  snapshot,
}: {
  source: MediaSource | null;
  snapshot: AnalysisSnapshot;
}) {
  const [previewFrame, setPreviewFrame] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const level = (value?: number) => Math.max(0, Math.min(1, value ?? 0)) * 100;
  return (
    <aside
      aria-label="Source preview and audio analysis"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            <Icon name="eye" size={16} className="text-primary-fixed" />
            Source Preview
          </h2>
          <span className="font-code text-label-sm text-tertiary-fixed-dim">
            Frame{" "}
            {source ? (snapshot.frame ?? previewFrame).toLocaleString() : "—"}
          </span>
        </div>
        <figure className="relative w-full overflow-hidden rounded-lg bg-surface-container-highest">
          <div className="relative aspect-video w-full bg-surface-container-lowest">
            {source?.url ? (
              <video
                key={source.id}
                src={source.url}
                aria-label={`Analysis preview: ${source.name}`}
                controls
                playsInline
                muted
                preload="auto"
                className="h-full w-full object-contain"
                onLoadedMetadata={(event) => {
                  // Request the opening frame even in browsers that defer a paused video’s poster.
                  event.currentTarget.currentTime = Math.min(
                    0.001,
                    event.currentTarget.duration / 2,
                  );
                }}
                onTimeUpdate={(event) =>
                  setPreviewFrame(
                    Math.floor(event.currentTarget.currentTime * source.fps),
                  )
                }
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-body-sm text-on-surface-variant">
                <Icon name="video" size={28} className="text-primary-fixed" />
                Preparing video preview…
              </div>
            )}
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-1 bg-surface-container-lowest/85 px-2.5 py-1 font-code text-[0.625rem] text-on-surface">
            <span>Original frame · No crop</span>
            <span className="text-primary-fixed">
              {source ? `${source.width} × ${source.height}` : "—"}
            </span>
          </figcaption>
        </figure>
        {previewError && (
          <p role="alert" className="text-body-sm text-error">
            This browser could not preview the video.
          </p>
        )}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between gap-2 text-label-sm">
            <span className="text-on-surface-variant">
              Speech Cadence Detection
            </span>
            <span className="font-code text-on-surface">
              {snapshot.speechWpm === undefined
                ? "—"
                : `${snapshot.speechWpm} WPM`}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
          >
            <div
              className="h-full bg-secondary"
              style={{
                width: `${level(snapshot.speechWpm === undefined ? undefined : snapshot.speechWpm / 240)}%`,
              }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-label-sm">
            <span className="text-on-surface-variant">
              Sound Events Detected
            </span>
            <span className="font-code text-on-surface">
              {snapshot.soundEvents === undefined
                ? "—"
                : snapshot.soundEvents.toLocaleString()}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
          >
            <div
              className="h-full bg-tertiary-fixed-dim"
              style={{ width: `${level(snapshot.audioLevel)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl bg-surface-container-lowest/80 p-4">
        <Icon name="shield" className="mt-0.5 shrink-0 text-primary-fixed" />
        <p className="text-body-sm leading-relaxed text-on-surface-variant">
          <strong className="text-on-surface">Zero cloud upload.</strong> Your
          video stays on this device. No audio or video data is uploaded to a
          cloud processing queue.
        </p>
      </div>
    </aside>
  );
}
