"use client";
import { GuestAllowance } from "@/features/guest";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  sourceGuidance,
  type AnalysisOptions,
} from "@/lib/analysis/options";
import {
  MODEL_NAMES,
  type ModelAvailability,
} from "@/lib/analysis/model-storage";
import type { MediaSource } from "@/types/editing";
import { ModelTransfer } from "./model-transfer";
import { prepareAnalysisWorker } from "@/lib/analysis/prepared-worker";
import type { ModelPreparation } from "@/lib/analysis/protocol";

export function AnalysisSetup({
  source,
  onStart,
  onCancel,
  onPrepared,
  autoStart = true,
}: {
  source: MediaSource;
  onStart: (options: AnalysisOptions) => void;
  onCancel: () => void;
  onPrepared?: (preparation: ModelPreparation | null) => void;
  autoStart?: boolean;
}) {
  const [guestReady, setGuestReady] = useState(false);
  const [models, setModels] = useState<ModelAvailability | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparation, setPreparation] = useState<ModelPreparation | null>(null);
  const [revision, setRevision] = useState(0);
  const started = useRef(false);
  const refresh = useCallback(() => {
    setModels(null);
    setPreparation(null);
    setRevision((value) => value + 1);
  }, []);
  const guidance = sourceGuidance(source.durationInFrames / source.fps);
  useEffect(() => {
    let mounted = true;
    onPrepared?.(null);
    if (guidance.blocked) return;
    const dispose = prepareAnalysisWorker((result) => {
      if (!mounted) return;
      setModels(result.models);
      setPreparation(result);
      onPrepared?.(result);
    });
    return () => {
      mounted = false;
      dispose();
    };
  }, [revision, onPrepared, guidance.blocked]);
  useEffect(() => {
    if (
      !autoStart ||
      started.current ||
      !preparation?.speechReady ||
      !guestReady ||
      busy ||
      guidance.blocked
    )
      return;
    started.current = true;
    onStart(DEFAULT_ANALYSIS_OPTIONS);
  }, [autoStart, preparation, guestReady, busy, guidance.blocked, onStart]);
  const cancel = () => {
    started.current = true;
    onCancel();
  };
  const needed = models
    ? (Object.keys(MODEL_NAMES) as (keyof ModelAvailability)[]).filter(
        (key) => models[key] !== "ready",
      )
    : [];
  const start = () => {
    if (started.current || busy || !models || !guestReady || guidance.blocked)
      return;
    started.current = true;
    onStart({ ...DEFAULT_ANALYSIS_OPTIONS, allowModelDownloads: true });
  };
  if (
    !guidance.blocked &&
    (!preparation || (preparation.speechReady && autoStart))
  )
    return (
      <div className="flex flex-col gap-3">
        {source.durationInFrames / source.fps < 60 && (
          <p className="text-body-sm text-on-surface-variant">
            {guidance.message}
          </p>
        )}
        <p role="status" className="text-body-sm text-on-surface-variant">
          {preparation?.speechReady
            ? "Speech model ready. Starting analysis…"
            : "Loading saved speech model…"}
        </p>
        <GuestAllowance onReady={setGuestReady} />
        <button
          type="button"
          onClick={cancel}
          className="self-start text-label-md text-on-surface-variant"
        >
          Cancel
        </button>
      </div>
    );
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
          {guidance.blocked
            ? "Choose a longer video to prepare the models."
            : "Loading saved speech model… No missing model weights will be downloaded until you start."}
        </p>
      ) : (
        <p role="status" className="text-body-sm text-on-surface-variant">
          {preparation?.speechReady
            ? "Speech model ready — loaded from this browser. Starting will reuse it."
            : preparation?.error
              ? "Speech model initialization could not finish. Starting will retry using saved files."
              : "Speech model will load when you start; saved files are reused."}
        </p>
      )}
      {models &&
        (needed.length ? (
          <div className="text-body-sm text-on-surface-variant" role="status">
            <p>
              {needed.some((key) => models[key] === "unknown")
                ? "Some saved models could not be verified."
                : "Remaining models have not finished downloading in this browser."}{" "}
              Later analysis stages will download missing files if needed:{" "}
              {needed.map((key) => MODEL_NAMES[key]).join(", ")}. Import a model
              pack to reuse your downloads, or cancel to go back.
            </p>
          </div>
        ) : (
          <p role="status" className="text-body-sm text-on-surface-variant">
            Required model files are already saved in this browser. They will be
            loaded for analysis; browser runtime files may still be needed.
          </p>
        ))}
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
          disabled={guidance.blocked || !guestReady || !models || busy}
          onClick={() => void start()}
          className="self-start rounded-lg bg-primary-container px-5 py-2.5 text-label-md font-bold text-on-primary-fixed disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start analysis
        </button>
        <button
          type="button"
          onClick={cancel}
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
