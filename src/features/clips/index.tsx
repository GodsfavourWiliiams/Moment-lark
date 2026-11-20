"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditing } from "@/hooks/use-editing";
import { useExportQueue } from "@/hooks/use-export-queue";
import { createManualClip, queueClips } from "@/lib/clip-queue";
import { editorHref, getStudioSection } from "@/config/navigation";
import { ClipPreviewDialog } from "@/components/media/clip-preview-dialog";
import { QueueSummary } from "./components/queue-summary";
import { QueueFilters } from "./components/queue-filters";
import { QueueCard } from "./components/queue-card";
import { QueueActions } from "./components/queue-actions";
import type { QueueFilter, QueueSort } from "@/types/export";

export function ClipsPage() {
  const { document, dispatch, announcement, past } = useEditing();
  const exports = useExportQueue();
  const router = useRouter();
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [sort, setSort] = useState<QueueSort>("timeline");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const kept = document.clips.filter((clip) => clip.status === "kept");
  const visible = queueClips(document.clips, filter, sort);
  const selected = kept
    .filter(
      (clip) =>
        exports.selection === null || exports.selection.includes(clip.id),
    )
    .map((clip) => clip.id);
  const preview = document.clips.find((clip) => clip.id === previewId) ?? null;
  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-space-lg px-space-md py-space-lg lg:px-space-xl">
      <QueueSummary clips={kept} source={document.source} />
      <QueueFilters
        clips={kept}
        filter={filter}
        sort={sort}
        onFilter={setFilter}
        onSort={setSort}
      />
      {announcement && (
        <div className="flex items-center justify-between gap-3 text-body-sm text-on-surface-variant">
          <p role="status">{announcement}</p>
          <button
            type="button"
            disabled={!past.length}
            onClick={() => dispatch({ type: "undo" })}
            className="rounded px-3 py-1 text-primary-fixed hover:bg-surface-container disabled:opacity-40"
          >
            Undo
          </button>
        </div>
      )}
      <div className="flex flex-col gap-space-md">
        {visible.map((clip) => (
          <QueueCard
            key={clip.id}
            clip={clip}
            source={document.source}
            selected={selected.includes(clip.id)}
            onSelect={() =>
              exports.select(
                selected.includes(clip.id)
                  ? selected.filter((id) => id !== clip.id)
                  : [...selected, clip.id],
              )
            }
            onPreview={() => setPreviewId(clip.id)}
            onRemove={() =>
              dispatch({ type: "review", id: clip.id, status: "unreviewed" })
            }
            onDuplicate={() => {
              const id = crypto.randomUUID();
              dispatch({ type: "duplicate", id: clip.id, newId: id });
              exports.select([...selected, id]);
            }}
          />
        ))}
        {!visible.length && (
          <div className="rounded-xl bg-surface-container-low p-10 text-center">
            <h2 className="text-headline-md">
              {kept.length
                ? "No clips match this filter"
                : "Your kept clips will appear here"}
            </h2>
            <p className="mt-2 text-on-surface-variant">
              {kept.length
                ? "Choose another format to see the rest of your queue."
                : "Keep a suggestion or create a manual clip to start your queue."}
            </p>
            <Link
              href={getStudioSection("suggestions").href}
              className="mt-4 inline-flex rounded-lg bg-surface-container-high px-4 py-2 text-primary-fixed"
            >
              Back to Suggestions
            </Link>
          </div>
        )}
      </div>
      <QueueActions
        total={kept.length}
        selected={selected.length}
        onSelectAll={() =>
          exports.select(selected.length === kept.length ? [] : null)
        }
        onCreate={() => {
          const clip = createManualClip(document, crypto.randomUUID());
          dispatch({ type: "append", clip });
          router.push(editorHref(clip.id));
        }}
        onExport={() => {
          exports.select(selected);
          dispatch({ type: "prepare-export", ids: selected });
          router.push(getStudioSection("export").href);
        }}
      />
      <ClipPreviewDialog
        clip={preview}
        source={document.source}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}
