import type { ExportAction, ExportJob } from "../types/export";

export function exportReducer(
  state: ExportJob[],
  action: ExportAction,
): ExportJob[] {
  if (action.type === "enqueue") {
    const replacing = new Set(action.jobs.map((job) => job.id));
    return [...state.filter((job) => !replacing.has(job.id)), ...action.jobs];
  }
  return state.map((job) =>
    job.id === action.id ? { ...job, ...action.patch } : job,
  );
}

export function exportSummary(jobs: ExportJob[]) {
  const complete = jobs.filter((job) => job.status === "complete").length;
  return {
    complete,
    progress: jobs.length
      ? jobs.reduce(
          (total, job) =>
            total +
            (job.status === "complete"
              ? 1
              : job.status === "rendering"
                ? job.progress
                : 0),
          0,
        ) / jobs.length
      : 0,
    bytes: jobs.reduce((total, job) => total + (job.blob?.size ?? 0), 0),
  };
}
