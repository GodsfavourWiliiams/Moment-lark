"use client";
import { useState } from "react";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  sourceGuidance,
  type AnalysisOptions,
} from "@/lib/analysis/options";
import type { MediaSource } from "@/types/editing";

export function AnalysisSetup({
  source,
  onStart,
}: {
  source: MediaSource;
  onStart: (options: AnalysisOptions) => void;
}) {
  const [soundEvents, setSoundEvents] = useState(
    DEFAULT_ANALYSIS_OPTIONS.soundEvents,
  );
  const guidance = sourceGuidance(source.durationInFrames / source.fps);
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4">
      <p role="status" className="text-body-md text-on-surface">
        {guidance.message}
      </p>
      <div className="text-body-sm leading-relaxed text-on-surface-variant">
        <p>
          Speech analysis uses{" "}
          <strong className="text-on-surface">Whisper Base</strong> (about 206
          MB) and <strong className="text-on-surface">Qwen2.5 1.5B</strong>{" "}
          (about 869 MB) to select moments and write titles. The first run
          downloads these models; later runs reuse browser-cached files when
          available.
        </p>
        <p className="mt-2">
          Allow roughly 1.1 GB for model weights, plus runtime files and working
          memory. Model loading and analysis speed depend on your device. No
          paid AI API is used.
        </p>
      </div>
      <label className="flex items-start gap-3 rounded-lg bg-surface-container p-3 text-body-sm">
        <input
          type="checkbox"
          checked={soundEvents}
          onChange={(event) => setSoundEvents(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary-container"
        />
        <span>
          <strong className="block text-on-surface">
            Also scan for laughter, cheering and action sounds
          </strong>
          <span className="text-on-surface-variant">
            Adds AudioSet AST (about 91 MB) and a second full audio scan. Useful
            for streams and gameplay reactions; slower than speech-only
            analysis. It does not recognize visual game events.
          </span>
        </span>
      </label>
      <button
        type="button"
        disabled={guidance.blocked}
        onClick={() => onStart({ soundEvents })}
        className="self-start rounded-lg bg-primary-container px-5 py-2.5 text-label-md font-bold text-on-primary-fixed disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start local analysis
      </button>
      <p className="text-body-sm text-on-surface-variant">
        Starting reserves one of your three video slots. Cancellation or
        analysis failure releases it.
      </p>
    </div>
  );
}
