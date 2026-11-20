import type { ClipDocument, MediaSource } from "./editing";

export type ExportStatus =
  | "queued"
  | "rendering"
  | "complete"
  | "error"
  | "canceled";
export type ExportJob = {
  id: string;
  clip: ClipDocument;
  source: MediaSource;
  status: ExportStatus;
  progress: number;
  message: string;
  blob: Blob | null;
  url: string | null;
  filename: string;
};
export type ExportAction =
  | { type: "enqueue"; jobs: ExportJob[] }
  | {
      type: "update";
      id: string;
      patch: Partial<
        Pick<ExportJob, "status" | "progress" | "message" | "blob" | "url">
      >;
    };
export type QueueFilter = "all" | "original" | "9:16" | "1:1";
export type QueueSort = "timeline" | "shortest" | "longest" | "score";
