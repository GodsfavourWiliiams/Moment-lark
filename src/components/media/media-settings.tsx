"use client";
import { useRef, useState } from "react";
import { Button, Dialog } from "@/components/ui";
import { useEditing } from "@/hooks/use-editing";
import type { ClipDocument } from "@/types/editing";

export function MediaSettings({
  open,
  onClose,
  clip,
}: {
  open: boolean;
  onClose: () => void;
  clip?: ClipDocument;
}) {
  const { document, dispatch, loadFile } = useEditing();
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onClose={onClose} title="Preview settings">
      <div className="flex flex-col gap-4">
        <p className="text-body-md text-on-surface-variant">
          {document.source.kind === "demo"
            ? "The supplied design uses still images and example suggestions. Open a local video for real playback, trimming, captions, and MP4 export. Your video stays on this device."
            : `Editing ${document.source.name}. Changes stay in this browser session.`}
        </p>
        {clip && clip.aspect !== "original" && (
          <label className="flex flex-col gap-2 text-label-md">
            Horizontal crop position
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={clip.cropX}
              onChange={(event) =>
                dispatch({
                  type: "patch",
                  id: clip.id,
                  patch: { cropX: Number(event.target.value), centered: false },
                })
              }
              className="h-6 w-full accent-primary-container"
            />
          </label>
        )}
        <Button disabled={loading} onClick={() => input.current?.click()}>
          {loading ? "Reading local video…" : "Open local video"}
        </Button>
        <input
          ref={input}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          aria-label="Open local video"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setLoading(true);
            setError(null);
            try {
              if (await loadFile(file)) onClose();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not open this video.",
              );
            } finally {
              setLoading(false);
            }
          }}
        />
        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}
        <p className="text-body-sm text-on-surface-variant">
          Automatic transcription, highlight ranking, and active-speaker
          tracking are not connected yet. The crop can be positioned manually.
        </p>
      </div>
    </Dialog>
  );
}
