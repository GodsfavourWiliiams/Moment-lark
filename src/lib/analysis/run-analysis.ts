import type { MediaSource, ClipDocument } from "../../types/editing";
import type { AnalysisSnapshot } from "../../types/analysis";
import type { AnalysisEvent } from "./protocol";
import { loadGuestUsage } from "../../services/guest";
import { analysisJobRequest } from "../../services/analysis-jobs";

export async function runAnalysis(
  file: File,
  source: MediaSource,
  signal: AbortSignal,
  onProgress: (snapshot: AnalysisSnapshot) => void,
): Promise<ClipDocument[]> {
  signal.throwIfAborted();
  await loadGuestUsage();
  signal.throwIfAborted();
  const id = crypto.randomUUID();
  let worker: Worker | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let reserved = false;
  let finished = false;
  const cancel = () => {
    worker?.terminate();
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const job = await analysisJobRequest("", {
      id,
      sourceId: source.id,
      fileBytes: file.size,
    });
    reserved = job.status === "reserved";
    if (!reserved)
      throw new Error(
        "This analysis job is no longer available. Please import the video again.",
      );
    signal.throwIfAborted();
    worker = new Worker(
      new URL("../../workers/analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    const clips = await new Promise<ClipDocument[]>((resolve, reject) => {
      const abort = () =>
        reject(
          signal.reason ?? new DOMException("Analysis cancelled", "AbortError"),
        );
      signal.addEventListener("abort", abort, { once: true });
      const finish = (result?: ClipDocument[], error?: unknown) => {
        signal.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve(result ?? []);
      };
      worker!.onerror = () =>
        finish(
          undefined,
          new Error(
            "The local AI worker stopped. Check browser WebGPU support and available memory, then retry.",
          ),
        );
      worker!.onmessage = (event: MessageEvent<AnalysisEvent>) => {
        if (signal.aborted) return;
        if (event.data.type === "progress") onProgress(event.data.snapshot);
        else if (event.data.type === "complete") finish(event.data.clips);
        else finish(undefined, new Error(event.data.message));
      };
      let checking = false;
      heartbeat = setInterval(() => {
        if (checking) return;
        checking = true;
        void analysisJobRequest("heartbeat", { id })
          .then(
            (job) => {
              if (job.status !== "reserved")
                finish(
                  undefined,
                  new Error("Your analysis reservation expired. Please retry."),
                );
            },
            () =>
              finish(
                undefined,
                new Error(
                  "Connection to your guest session was lost. Please retry when online.",
                ),
              ),
          )
          .finally(() => {
            checking = false;
          });
      }, 60_000);
      worker!.postMessage({ file, source });
    });
    signal.throwIfAborted();
    worker.terminate();
    clearInterval(heartbeat);
    const completed = await analysisJobRequest("complete", { id });
    if (completed.status !== "completed")
      throw new Error(
        "The analysis reservation expired before completion. Please retry.",
      );
    finished = true;
    signal.throwIfAborted();
    return clips;
  } finally {
    signal.removeEventListener("abort", cancel);
    clearInterval(heartbeat);
    worker?.terminate();
    if (reserved && !finished)
      await analysisJobRequest("cancel", { id }).catch(() => {
        // A lost connection cannot strand quota permanently: the server lease expires.
      });
  }
}
