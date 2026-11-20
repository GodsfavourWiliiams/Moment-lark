"use client";
import { Player } from "@remotion/player";
import { Dialog } from "@/components/ui";
import { ClipComposition } from "./clip-composition";
import { outputSize } from "@/lib/clip-geometry";
import type { ClipDocument, MediaSource } from "@/types/editing";

export function ClipPreviewDialog({
  clip,
  source,
  url,
  onClose,
}: {
  clip: ClipDocument | null;
  source: MediaSource;
  url?: string | null;
  onClose: () => void;
}) {
  const size = clip ? outputSize(clip.aspect, source) : source;
  return (
    <Dialog
      open={clip !== null}
      onClose={onClose}
      title={clip ? `Preview Clip #${clip.ordinal}` : "Clip preview"}
    >
      {clip && (
        <>
          {url ? (
            <video
              controls
              playsInline
              src={url}
              aria-label={`Rendered preview: ${clip.title}`}
              className="max-h-[65dvh] w-full rounded-lg bg-black"
            />
          ) : (
            <Player
              key={clip.id}
              component={ClipComposition}
              inputProps={{
                source,
                clip,
                startFrame: clip.inFrame,
                preview: false,
                captionsVisible: true,
              }}
              compositionWidth={size.width}
              compositionHeight={size.height}
              fps={source.fps}
              durationInFrames={clip.outFrame - clip.inFrame}
              controls
              style={{
                width: "100%",
                maxHeight: "65dvh",
                aspectRatio: `${size.width}/${size.height}`,
              }}
              errorFallback={({ error }) => (
                <p role="alert" className="p-4 text-error">
                  {error.message}
                </p>
              )}
            />
          )}
          <p className="mt-3 text-body-sm text-on-surface-variant">
            {clip.title}
          </p>
        </>
      )}
    </Dialog>
  );
}
