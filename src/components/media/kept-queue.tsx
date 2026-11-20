"use client";
import Link from "next/link";
import { Button, Dialog, Icon } from "@/components/ui";
import { editorHref } from "@/config/navigation";
import { useEditing } from "@/hooks/use-editing";
import { useClipExport } from "@/hooks/use-clip-export";
import { durationLabel } from "@/lib/timecode";

export function KeptQueue({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { document, dispatch } = useEditing();
  const render = useClipExport();
  const kept = document.clips.filter((clip) => clip.status === "kept");
  const close = () => {
    if (render.status === "rendering") render.cancel();
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} title={`Kept clips (${kept.length})`}>
      <div className="flex flex-col gap-4">
        {document.source.kind === "demo" && (
          <p className="text-body-sm text-on-surface-variant">
            These are design samples. Open a local video in Preview settings to
            export real footage.
          </p>
        )}
        {!kept.length && (
          <p className="text-on-surface-variant">
            Keep a suggestion to add it to your queue.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {kept.map((clip) => (
            <li
              key={clip.id}
              className="rounded-lg bg-surface-container-low p-3"
            >
              <div className="flex justify-between gap-3">
                <Link
                  href={editorHref(clip.id)}
                  onClick={close}
                  className="font-semibold hover:text-primary-fixed"
                >
                  {clip.title}
                </Link>
                <span className="shrink-0 text-body-sm text-on-surface-variant">
                  {durationLabel(
                    clip.outFrame - clip.inFrame,
                    document.source.fps,
                  )}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-2">
                <button
                  type="button"
                  disabled={render.status === "rendering"}
                  onClick={() =>
                    dispatch({
                      type: "review",
                      id: clip.id,
                      status: "unreviewed",
                    })
                  }
                  className="text-label-sm text-on-surface-variant hover:text-error disabled:opacity-50"
                >
                  Remove from queue
                </button>
                <button
                  type="button"
                  disabled={
                    !document.source.url || render.status === "rendering"
                  }
                  onClick={() => void render.start(document.source, clip)}
                  className="inline-flex items-center gap-1 text-label-md font-semibold text-primary-fixed disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="download" size={16} />
                  Export MP4
                </button>
              </div>
            </li>
          ))}
        </ul>
        {render.message && (
          <p
            role={render.status === "error" ? "alert" : "status"}
            className={`text-body-sm ${render.status === "error" ? "text-error" : "text-on-surface-variant"}`}
          >
            {render.message}
          </p>
        )}
        {render.status === "rendering" && (
          <>
            <progress
              aria-label="Clip export progress"
              value={render.progress}
              max={1}
              className="h-2 w-full accent-primary-container"
            />
            <Button onClick={render.cancel}>
              Cancel export ({Math.round(render.progress * 100)}%)
            </Button>
          </>
        )}
        {render.download && (
          <a
            href={render.download}
            download={render.filename}
            className="rounded-lg bg-primary-container px-4 py-3 text-center font-semibold text-on-primary-fixed"
          >
            Download MP4
          </a>
        )}
      </div>
    </Dialog>
  );
}
