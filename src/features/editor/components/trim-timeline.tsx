"use client";
import { useState } from "react";
import { Icon, Kbd } from "@/components/ui";
import { MediaButton } from "@/components/media/media-button";
import { TimelineHandle } from "@/components/media/timeline-handle";
import { TimecodeField } from "@/components/media/timecode-field";
import { Waveform } from "@/components/media/waveform";
import { useWaveform } from "@/hooks/use-waveform";
import { clamp, durationLabel, timecode } from "@/lib/timecode";
import type { ClipDocument, ClipPatch, MediaSource } from "@/types/editing";

export function TrimTimeline({
  clip,
  source,
  frame,
  onSeek,
  onPatch,
}: {
  clip: ClipDocument;
  source: MediaSource;
  frame: number;
  onSeek: (frame: number) => void;
  onPatch: (patch: ClipPatch) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const context = Math.max(
    source.fps * 2,
    ((clip.originalOut - clip.originalIn) * 0.28125) / zoom,
  );
  const start = Math.max(0, Math.min(clip.inFrame, clip.originalIn) - context);
  const end = Math.min(
    source.durationInFrames,
    Math.max(clip.outFrame, clip.originalOut) + context,
  );
  const peaks = useWaveform(source, Math.floor(start), Math.ceil(end));
  const ticks = Array.from(
    { length: 7 },
    (_, i) => start + ((end - start) * i) / 6,
  );
  return (
    <section
      aria-labelledby="trim-heading"
      className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-space-md">
          <h2
            id="trim-heading"
            className="flex items-center gap-1 text-label-md font-medium"
          >
            <Icon name="sliders" size={18} className="text-primary-fixed" />
            Trim Handles &amp; Waveform
          </h2>
          <div className="hidden items-center gap-1 text-body-sm text-on-surface-variant sm:flex">
            Shortcuts: <Kbd>I</Kbd> Set In <Kbd>O</Kbd> Set Out <Kbd>Space</Kbd>{" "}
            Scrub
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MediaButton
            icon="zoomOut"
            label="Zoom out timeline"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value / 2))}
            size="sm"
          />
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high">
            <span
              className="block h-full bg-surface-variant"
              style={{ width: `${(zoom / 4) * 100}%` }}
            />
          </span>
          <MediaButton
            icon="zoomIn"
            label="Zoom in timeline"
            disabled={zoom >= 4}
            onClick={() => setZoom((value) => Math.min(4, value * 2))}
            size="sm"
          />
        </div>
      </div>
      <div className="rounded-lg bg-surface-container-lowest p-2 shadow-inner">
        <div className="mb-2 flex justify-between gap-1 px-1 text-[10px] text-on-surface-variant">
          {ticks.map((tick, index) => (
            <span key={index} className={index % 2 ? "hidden sm:inline" : ""}>
              {timecode(tick, source.fps)}
            </span>
          ))}
        </div>
        <div className="relative mx-2 h-20 rounded bg-surface-container">
          <div className="absolute inset-0 px-2 py-4 text-outline/20">
            <Waveform peaks={peaks} />
          </div>
          <div
            className="absolute inset-y-0 overflow-hidden bg-surface-container-high px-3 py-4 text-secondary"
            style={{
              left: `${((clip.inFrame - start) / (end - start)) * 100}%`,
              width: `${((clip.outFrame - clip.inFrame) / (end - start)) * 100}%`,
            }}
          >
            <Waveform peaks={peaks} />
          </div>
          <TimelineHandle
            label="Clip in point"
            value={clip.inFrame}
            min={Math.ceil(start)}
            max={clip.outFrame - 1}
            windowStart={start}
            windowEnd={end}
            fps={source.fps}
            onChange={(value) => onPatch({ inFrame: value })}
          />
          <TimelineHandle
            label="Clip out point"
            value={clip.outFrame}
            min={clip.inFrame + 1}
            max={Math.floor(end)}
            windowStart={start}
            windowEnd={end}
            fps={source.fps}
            onChange={(value) => onPatch({ outFrame: value })}
          />
          <TimelineHandle
            label="Editor playhead"
            value={clamp(frame, start, end)}
            min={Math.ceil(start)}
            max={Math.min(source.durationInFrames - 1, Math.floor(end))}
            windowStart={start}
            windowEnd={end}
            fps={source.fps}
            onChange={onSeek}
            playhead
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-space-md">
          <TimecodeField
            id="clip-in-field"
            label="In:"
            value={clip.inFrame}
            fps={source.fps}
            min={0}
            max={clip.outFrame - 1}
            onChange={(value) => onPatch({ inFrame: value })}
          />
          <TimecodeField
            label="Out:"
            value={clip.outFrame}
            fps={source.fps}
            min={clip.inFrame + 1}
            max={source.durationInFrames}
            onChange={(value) => onPatch({ outFrame: value })}
          />
        </div>
        <div className="flex flex-wrap gap-space-md text-body-sm text-on-surface-variant">
          <span className="rounded bg-surface-container-highest px-2 py-0.5 text-label-sm font-semibold text-on-surface">
            Selected: {durationLabel(clip.outFrame - clip.inFrame, source.fps)}{" "}
            ({Math.round((clip.outFrame - clip.inFrame) / source.fps)} Seconds)
          </span>
          <span>Snap: Active (1 Frame)</span>
        </div>
      </div>
    </section>
  );
}
