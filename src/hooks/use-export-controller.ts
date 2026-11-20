"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { exportReducer } from "@/state/export";
import { exportClip } from "@/lib/media/export-clip";
import { clipFilename } from "@/lib/clip-queue";
import type { ClipDocument, MediaSource } from "@/types/editing";
import type { ExportJob } from "@/types/export";

/** One encoder at a time; snapshots stay stable if the editor changes during a render. */
export function useExportController(source: MediaSource) {
  const [jobs, dispatch] = useReducer(exportReducer, []);
  const [busy, setBusy] = useState(false);
  const [selection, select] = useState<string[] | null>(null);
  const running = useRef(false);
  const alive = useRef(true);
  const active = useRef<{ id: string; controller: AbortController } | null>(
    null,
  );
  const canceled = useRef(new Set<string>());
  const urls = useRef(new Map<string, string>());
  useEffect(() => {
    alive.current = true;
    const ownedUrls = urls.current;
    return () => {
      alive.current = false;
      active.current?.controller.abort();
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
      ownedUrls.clear();
    };
  }, []);

  const start = async (clips: ClipDocument[]) => {
    if (running.current || !source.url || !clips.length) return;
    running.current = true;
    setBusy(true);
    canceled.current.clear();
    const pending: ExportJob[] = clips.map((clip) => ({
      id: clip.id,
      clip: structuredClone(clip),
      source: { ...source },
      status: "queued",
      progress: 0,
      message: "Waiting for the local encoder",
      blob: null,
      url: null,
      filename: clipFilename(clip),
    }));
    pending.forEach((job) => {
      const previous = urls.current.get(job.id);
      if (previous) URL.revokeObjectURL(previous);
      urls.current.delete(job.id);
    });
    dispatch({ type: "enqueue", jobs: pending });
    try {
      for (const job of pending) {
        if (!alive.current) break;
        if (canceled.current.has(job.id)) continue;
        const controller = new AbortController();
        active.current = { id: job.id, controller };
        dispatch({
          type: "update",
          id: job.id,
          patch: {
            status: "rendering",
            message: "Encoding video frames on this device…",
          },
        });
        try {
          const blob = await exportClip(
            job.source,
            job.clip,
            controller.signal,
            (progress) => {
              if (alive.current && !controller.signal.aborted)
                dispatch({
                  type: "update",
                  id: job.id,
                  patch: { progress: Math.min(1, Math.max(0, progress)) },
                });
            },
          );
          if (!alive.current || controller.signal.aborted) continue;
          const url = URL.createObjectURL(blob);
          urls.current.set(job.id, url);
          dispatch({
            type: "update",
            id: job.id,
            patch: {
              status: "complete",
              progress: 1,
              blob,
              url,
              message: "Ready to download",
            },
          });
        } catch (error) {
          if (alive.current && !controller.signal.aborted)
            dispatch({
              type: "update",
              id: job.id,
              patch: {
                status: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "The browser could not render this clip. Your edits are preserved; retry when ready.",
              },
            });
        } finally {
          active.current = null;
        }
      }
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const cancel = (id: string) => {
    canceled.current.add(id);
    if (active.current?.id === id) active.current.controller.abort();
    dispatch({
      type: "update",
      id,
      patch: {
        status: "canceled",
        progress: 0,
        message: "Render canceled. Your clip edits are preserved.",
      },
    });
  };
  return { jobs, busy, selection, select, start, cancel };
}
