import type { AnalysisEvent, ModelPreparation } from "./protocol";

let prepared: Worker | undefined;
export function createAnalysisWorker() {
  return new Worker(
    new URL("../../workers/analysis.worker.ts", import.meta.url),
    { type: "module" },
  );
}

/** The form owns this worker until Start transfers ownership to runAnalysis. */
export function prepareAnalysisWorker(
  onReady: (result: ModelPreparation) => void,
) {
  prepared?.terminate();
  const worker = createAnalysisWorker();
  prepared = worker;
  worker.onmessage = ({ data }: MessageEvent<AnalysisEvent>) => {
    if (data.type === "prepared") onReady(data.preparation);
  };
  worker.onerror = () => {
    worker.terminate();
    if (prepared === worker) prepared = undefined;
    onReady({
      models: { speech: "unknown", sound: "unknown", ranking: "unknown" },
      speechReady: false,
      error:
        "The model check could not finish. You can retry when starting analysis.",
    });
  };
  worker.postMessage({ type: "prepare" });
  return () => {
    // React unmounts the setup form after Start; keep the claimed worker alive.
    if (prepared === worker) {
      prepared = undefined;
      worker.terminate();
    }
  };
}

export function claimPreparedWorker() {
  const worker = prepared;
  prepared = undefined;
  return worker;
}
