import {
  analysisJobSchema,
  type AnalysisProvenance,
} from "../../shared/contracts/analysis-job";
import { GuestApiError } from "./guest";

/** Retrying a lost response is safe: each operation uses the same job ID. */
export async function analysisJobRequest(
  action: "" | "heartbeat" | "complete" | "cancel",
  body: {
    id: string;
    sourceId?: string;
    fileBytes?: number;
    provenance?: AnalysisProvenance;
    timings?: Record<string, number>;
  },
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        `/api/analysis-jobs${action ? `/${action}` : ""}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
          keepalive: action === "cancel",
        },
      );
      const value = await response.json();
      if (!response.ok)
        throw new GuestApiError(
          value?.error?.code ?? "analysis_unavailable",
          value?.error?.message ?? "Could not update analysis. Please retry.",
        );
      return analysisJobSchema.parse(value);
    } catch (error) {
      if (error instanceof GuestApiError) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
