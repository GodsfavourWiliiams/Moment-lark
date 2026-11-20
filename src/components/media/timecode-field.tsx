"use client";
import { useState } from "react";
import { parseTimecode, timecode } from "@/lib/timecode";

export function TimecodeField({
  label,
  value,
  fps,
  min,
  max,
  onChange,
  id,
}: {
  label: string;
  value: number;
  fps: number;
  min: number;
  max: number;
  onChange: (frame: number) => void;
  id?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const commit = () => {
    if (draft === null) return;
    const frame = parseTimecode(draft, fps);
    if (frame === null || frame < min || frame > max) {
      setError(true);
      return;
    }
    onChange(frame);
    setDraft(null);
    setError(false);
  };
  return (
    <label className="inline-flex flex-col gap-1 text-body-sm text-on-surface-variant">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-primary-container"
        />
        {label}
        <input
          id={id}
          aria-label={label}
          aria-invalid={error}
          title="HH:MM:SS.FF (frames)"
          value={draft ?? timecode(value, fps, true)}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              setDraft(null);
              setError(false);
            }
          }}
          className="w-28 rounded bg-transparent px-1 py-1 font-code text-code-timecode font-semibold text-on-surface tabular-nums focus:bg-surface-container-high"
        />
      </span>
      {error && (
        <span role="alert" className="max-w-48 text-error">
          Use a valid HH:MM:SS.FF within the clip bounds.
        </span>
      )}
    </label>
  );
}
