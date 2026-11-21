"use client";
import { GuestAllowance } from "@/features/guest";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  sourceGuidance,
  type AnalysisOptions,
} from "@/lib/analysis/options";
import {
  inspectModels,
  MODEL_NAMES,
  type ModelAvailability,
} from "@/lib/analysis/model-storage";
import type { MediaSource } from "@/types/editing";
import { ModelTransfer } from "./model-transfer";

export function AnalysisSetup({
  source,
  onStart,
  onCancel,
}: {
  source: MediaSource;
  onStart: (options: AnalysisOptions) => void;
  onCancel: () => void;
}) {
  const [guestReady, setGuestReady] = useState(false);
  const [models, setModels] = useState<ModelAvailability | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const refresh = useCallback(() => {
    void inspectModels().then(setModels);
  }, []);
  useEffect(() => {
    let mounted = true;
    void inspectModels().then((value) => {
      if (mounted) setModels(value);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const guidance = sourceGuidance(source.durationInFrames / source.fps);
  const needed = models
    ? (Object.keys(MODEL_NAMES) as (keyof ModelAvailability)[]).filter(
        (key) => models[key] !== "ready",
      )
    : [];
  const start = async () => {
    if (busy || checking || !models) return;
    setChecking(true);
    // Recheck immediately before starting: cached files can be removed by the browser.
    const latest = await inspectModels();
    const newlyMissing = (
      Object.keys(latest) as (keyof ModelAvailability)[]
    ).some((key) => models[key] === "ready" && latest[key] !== "ready");
    setModels(latest);
    setChecking(false);
    if (!newlyMissing) onStart(DEFAULT_ANALYSIS_OPTIONS);
  };
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4">
      <p role="status" className="text-body-md text-on-surface">
        {guidance.message}
      </p>
      <p className="text-body-sm text-on-surface-variant">
        Every analysis includes speech, laughter, cheering and action sounds.
        Sound analysis does not detect visual game events.
      </p>
      {!models ? (
        <p role="status" className="text-body-sm text-on-surface-variant">
          Checking saved models… No model downloads have started.
        </p>
      ) : needed.length ? (
        <div className="text-body-sm text-on-surface-variant" role="status">
          <p>
            {needed.some((key) => models[key] === "unknown")
              ? "Some saved models could not be verified."
              : "Some models are not saved in this browser."}{" "}
            Starting analysis downloads these if needed:{" "}
            {needed.map((key) => MODEL_NAMES[key]).join(", ")}. Import a model
            pack to reuse your downloads, or cancel to go back.
          </p>
        </div>
      ) : (
        <p role="status" className="text-body-sm text-on-surface-variant">
          Required model files are already saved in this browser. They will be
          loaded for analysis; browser runtime files may still be needed.
        </p>
      )}
      <details className="text-body-sm text-on-surface-variant">
        <summary className="cursor-pointer font-bold">
          Import or export saved models
        </summary>
        <div className="mt-3">
          <ModelTransfer onBusy={setBusy} onChanged={refresh} />
        </div>
      </details>
      <GuestAllowance onReady={setGuestReady} />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            guidance.blocked || !guestReady || !models || busy || checking
          }
          onClick={() => void start()}
          className="self-start rounded-lg bg-primary-container px-5 py-2.5 text-label-md font-bold text-on-primary-fixed disabled:cursor-not-allowed disabled:opacity-40"
        >
          {checking
            ? "Checking models…"
            : needed.length
              ? "Download missing models & start"
              : "Start local analysis"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-5 py-2.5 text-label-md font-bold text-on-surface-variant hover:bg-surface-container"
        >
          Cancel
        </button>
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Starting reserves one of your three video slots. Cancellation or
        analysis failure releases it.
      </p>
    </div>
  );
}
