"use client";
import { useEffect, useRef, useState } from "react";
import { createClipArchive } from "@/lib/media/download-archive";
import type { ExportJob } from "@/types/export";
export function useArchiveDownload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);
  const generation = useRef(0);
  const url = useRef<string | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  const download = async (jobs: ExportJob[]) => {
    if (active.current) return;
    const files = jobs.flatMap((job) =>
      job.status === "complete" && job.blob
        ? [{ filename: job.filename, blob: job.blob }]
        : [],
    );
    if (!files.length) return;
    const request = generation.current;
    active.current = true;
    setBusy(true);
    setError("");
    try {
      const blob = await createClipArchive(files);
      if (request !== generation.current) return;
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url.current;
      link.download = "moment-lark-clips.zip";
      link.click();
    } catch (error) {
      if (request === generation.current)
        setError(
          error instanceof Error
            ? error.message
            : "Could not create the ZIP. Individual MP4 downloads are still available.",
        );
    } finally {
      active.current = false;
      if (request === generation.current) setBusy(false);
    }
  };
  return { busy, error, download };
}
