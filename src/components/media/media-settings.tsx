"use client";
import { useStudio } from "@/hooks/use-studio";
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
  const { document, dispatch } = useEditing();
  const studio = useStudio();
  return (
    <Dialog open={open} onClose={onClose} title="Preview settings">
      <div className="flex flex-col gap-4">
        <p className="text-body-md text-on-surface-variant">
          Editing {document.source.name}. Changes stay in this browser session.
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
        <Button
          onClick={() => {
            onClose();
            studio.openPicker();
          }}
        >
          Open local video
        </Button>
        <p className="text-body-sm text-on-surface-variant">
          Automatic transcription, highlight ranking, and active-speaker
          tracking are not connected yet. The crop can be positioned manually.
        </p>
      </div>
    </Dialog>
  );
}
