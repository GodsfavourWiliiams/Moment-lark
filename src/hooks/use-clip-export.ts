"use client";
import { useEffect, useRef, useState } from "react";
import { exportClip } from "@/lib/media/export-clip";
import type { ClipDocument, MediaSource } from "@/types/editing";

export function useClipExport() {
  const controller = useRef<AbortController | null>(null);
  const resultUrl = useRef<string | null>(null);
  const [state, setState] = useState<{
    status: "idle" | "rendering" | "complete" | "error";
    progress: number;
    message: string;
    download: string | null;
    filename: string;
  }>({
    status: "idle",
    progress: 0,
    message: "",
    download: null,
    filename: "",
  });
  useEffect(
    () => () => {
      controller.current?.abort();
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    [],
  );
  const start = async (source: MediaSource, clip: ClipDocument) => {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setState({
      status: "rendering",
      progress: 0,
      message: `Rendering ${clip.title} on this device…`,
      download: null,
      filename: "",
    });
    try {
      const blob = await exportClip(source, clip, abort.signal, (progress) =>
        setState((state) => ({ ...state, progress })),
      );
      if (abort.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      resultUrl.current = url;
      setState({
        status: "complete",
        progress: 1,
        message:
          "MP4 ready. Your trim, crop, title, and timed captions are included.",
        download: url,
        filename: `${clip.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "moment-lark-clip"}.mp4`,
      });
    } catch (error) {
      if (!abort.signal.aborted)
        setState((state) => ({
          ...state,
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Export failed. Try a supported desktop browser.",
        }));
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  };
  const cancel = () => {
    controller.current?.abort();
    controller.current = null;
    setState((state) => ({
      ...state,
      status: "idle",
      message: "Export canceled.",
    }));
  };
  return { ...state, start, cancel };
}
