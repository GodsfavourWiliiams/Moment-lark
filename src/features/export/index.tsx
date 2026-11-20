"use client";
import { useState } from "react";
import Link from "next/link";
import { useEditing } from "@/hooks/use-editing";
import { useExportQueue } from "@/hooks/use-export-queue";
import { useArchiveDownload } from "@/hooks/use-archive-download";
import { getStudioSection } from "@/config/navigation";
import { renderSignature } from "@/lib/clip-queue";
import { exportSummary } from "@/state/export";
import { ClipPreviewDialog } from "@/components/media/clip-preview-dialog";
import { Icon } from "@/components/ui";
import { ExportSummary } from "./components/export-summary";
import { ExportCard } from "./components/export-card";
import { ExportFooter } from "./components/export-footer";

export function ExportPage() {
  const { document } = useEditing();
  const queue = useExportQueue();
  const archive = useArchiveDownload();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const currentJobs = queue.jobs.filter((job) => {
    const latest = document.clips.find((clip) => clip.id === job.id);
    return (
      job.status === "rendering" ||
      job.status === "queued" ||
      !latest ||
      renderSignature(latest) === renderSignature(job.clip)
    );
  });
  const selected = document.clips.filter(
    (clip) =>
      clip.status === "kept" &&
      (queue.selection === null || queue.selection.includes(clip.id)),
  );
  // Include already-started jobs, even if their clips are subsequently removed from the kept queue.
  const ids = [
    ...new Set([
      ...selected.map((clip) => clip.id),
      ...queue.jobs.map((job) => job.id),
    ]),
  ];
  const rows = ids.flatMap((id) => {
    const job = currentJobs.find((job) => job.id === id);
    const clip = job?.clip ?? document.clips.find((clip) => clip.id === id);
    return clip ? [{ clip, source: job?.source ?? document.source, job }] : [];
  });
  const summary = exportSummary(currentJobs);
  const progress = rows.length
    ? (summary.progress * currentJobs.length) / rows.length
    : 0;
  const active = queue.jobs.find((job) => job.status === "rendering");
  const pending = selected.filter(
    (clip) =>
      !currentJobs.some(
        (job) => job.id === clip.id && job.status === "complete",
      ),
  );
  const preview = queue.jobs.find((job) => job.id === previewId);
  const retry = (id: string) => {
    const clip =
      document.clips.find((clip) => clip.id === id) ??
      queue.jobs.find((job) => job.id === id)?.clip;
    if (clip) void queue.start([clip]);
  };
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-space-lg py-space-xl">
      <ExportSummary
        total={rows.length}
        complete={summary.complete}
        progress={progress}
        active={active?.clip.ordinal}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-body-sm text-on-surface-variant">
          {queue.busy
            ? "Rendering clips one at a time. You can continue reviewing in this tab."
            : rows.length && summary.complete === rows.length
              ? "Your finished clips are ready to download."
              : "Render your selected clips when you’re ready."}
        </p>
        <button
          type="button"
          disabled={queue.busy || !pending.length || !document.source.url}
          onClick={() => void queue.start(pending)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-label-md font-bold text-on-primary-fixed shadow-nav hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="download" size={18} />
          {queue.busy
            ? "Rendering…"
            : rows.length && summary.complete === rows.length
              ? "All clips rendered"
              : `Render Selected Clips (${pending.length})`}
        </button>
      </div>
      <div className="flex flex-col gap-space-lg">
        {rows.map(({ clip, source, job }) => (
          <ExportCard
            key={clip.id}
            clip={clip}
            source={source}
            job={job}
            busy={queue.busy}
            onStart={() => retry(clip.id)}
            onCancel={() => queue.cancel(clip.id)}
            onPreview={() => setPreviewId(clip.id)}
          />
        ))}
      </div>
      {!rows.length && (
        <div className="rounded-xl bg-surface-container-low p-10 text-center">
          <h2 className="text-headline-md">No clips selected for export</h2>
          <p className="mt-2 text-on-surface-variant">
            Choose clips from your kept queue to prepare a download.
          </p>
          <Link
            href={getStudioSection("clips").href}
            className="mt-4 inline-flex rounded-lg bg-surface-container-high px-4 py-2 text-primary-fixed"
          >
            Back to Clips Queue
          </Link>
        </div>
      )}
      <ExportFooter
        count={summary.complete}
        bytes={summary.bytes}
        sourceId={document.source.id}
        archiving={archive.busy}
        error={archive.error}
        onDownload={() => void archive.download(currentJobs)}
      />
      <ClipPreviewDialog
        clip={preview?.clip ?? null}
        source={preview?.source ?? document.source}
        url={preview?.url}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}
