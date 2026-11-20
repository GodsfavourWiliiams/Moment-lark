"use client";
import { useState } from "react";
import { Dialog, Icon } from "@/components/ui";
import { TimecodeField } from "@/components/media/timecode-field";
import { timecode } from "@/lib/timecode";
import type {
  CaptionCue,
  ClipDocument,
  ClipPatch,
  MediaSource,
} from "@/types/editing";

export function CaptionsPanel({
  source,
  clip,
  onPatch,
}: {
  source: MediaSource;
  clip: ClipDocument;
  onPatch: (patch: ClipPatch) => void;
}) {
  const [timestamps, setTimestamps] = useState(false);
  const text = clip.captions.map((cue) => cue.text).join("\n");
  const changeText = (value: string) => {
    const lines = value.split("\n");
    const length = Math.max(
      1,
      Math.floor((clip.outFrame - clip.inFrame) / lines.length),
    );
    const captions: CaptionCue[] = value
      ? lines.map((text, index) => ({
          id: clip.captions[index]?.id ?? `${clip.id}-caption-${index}`,
          text,
          start:
            clip.captions[index]?.start ??
            Math.min(clip.outFrame - 1, clip.inFrame + length * index),
          end:
            clip.captions[index]?.end ??
            Math.min(clip.outFrame, clip.inFrame + length * (index + 1)),
        }))
      : [];
    onPatch({ captions });
  };
  const updateCue = (id: string, patch: Partial<CaptionCue>) =>
    onPatch({
      captions: clip.captions.map((cue) =>
        cue.id === id ? { ...cue, ...patch } : cue,
      ),
    });
  return (
    <section
      aria-labelledby="captions-heading"
      className="flex flex-1 flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="captions-heading"
          className="flex items-center gap-1.5 text-label-md font-semibold"
        >
          <Icon name="captions" size={18} className="text-secondary" />
          Live Transcript &amp; Captions
        </h2>
        <span className="rounded bg-surface-container-highest px-2 py-0.5 text-label-sm text-on-surface-variant">
          Captions
        </span>
      </div>
      <div className="flex min-h-30 flex-1 flex-col gap-1 rounded-lg bg-surface-container-lowest p-2 shadow-inner">
        <textarea
          aria-label="Editable transcript, one caption per line"
          rows={4}
          value={text}
          onChange={(event) => changeText(event.target.value)}
          placeholder="Add captions, one cue per line…"
          className="min-h-24 w-full flex-1 resize-y rounded bg-transparent text-body-md leading-relaxed text-on-surface focus:outline-1 focus:outline-offset-2 focus:outline-primary-container"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-highest pt-1">
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <span className="size-1.5 rounded-full bg-tertiary-container" />
            {clip.captions.length} timed caption
            {clip.captions.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setTimestamps(true)}
            className="py-1 text-label-sm text-primary-fixed hover:underline"
          >
            Edit caption timestamps
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container px-3 py-2 shadow-sm">
        <span className="flex items-center gap-1 text-label-md font-medium">
          <Icon name="clock" size={16} className="text-primary-fixed" />
          Duration:
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <strong className="font-code text-code-timecode text-primary-fixed">
            {timecode(clip.outFrame - clip.inFrame, source.fps, true).slice(3)}
          </strong>
          <span className="text-on-surface-variant/40">•</span>
          <span className="text-label-sm text-on-surface-variant">
            Standard clip length
          </span>
        </div>
      </div>
      <Dialog
        open={timestamps}
        onClose={() => setTimestamps(false)}
        title="Caption timestamps"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Times refer to the original source. Only captions within the
            selected trim appear in the export.
          </p>
          {!clip.captions.length && (
            <p>Add a caption in the transcript first.</p>
          )}
          {clip.captions.map((cue) => (
            <fieldset
              key={cue.id}
              className="rounded-lg bg-surface-container-low p-3"
            >
              <legend className="px-1 text-body-sm">
                {cue.text || "Empty caption"}
              </legend>
              <div className="flex flex-wrap gap-3">
                <TimecodeField
                  label="Start:"
                  value={cue.start}
                  min={0}
                  max={cue.end - 1}
                  fps={source.fps}
                  onChange={(start) => updateCue(cue.id, { start })}
                />
                <TimecodeField
                  label="End:"
                  value={cue.end}
                  min={cue.start + 1}
                  max={source.durationInFrames}
                  fps={source.fps}
                  onChange={(end) => updateCue(cue.id, { end })}
                />
              </div>
            </fieldset>
          ))}
        </div>
      </Dialog>
    </section>
  );
}
