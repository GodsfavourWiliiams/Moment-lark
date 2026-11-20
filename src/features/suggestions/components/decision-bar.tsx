import Link from "next/link";
import { Icon } from "@/components/ui";
import { editorHref } from "@/config/navigation";
import { durationLabel } from "@/lib/timecode";
import type { ClipDocument } from "@/types/editing";

export function DecisionBar({
  clips,
  fps,
  activeId,
  onQueue,
}: {
  clips: ClipDocument[];
  fps: number;
  activeId: string;
  onQueue: () => void;
}) {
  const kept = clips.filter((clip) => clip.status === "kept");
  return (
    <aside
      aria-label="Review decisions"
      className="sticky bottom-0 z-40 w-full shrink-0 bg-surface-container-lowest/95 px-space-lg py-space-md shadow-2xl backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-md sm:flex-row">
        <div className="flex items-center gap-space-md">
          <span className="size-2.5 shrink-0 rounded-full bg-primary-fixed shadow-nav" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-headline-md">
              {kept.length} clip{kept.length === 1 ? "" : "s"} kept
            </strong>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-code text-body-md text-on-surface-variant">
              {durationLabel(
                kept.reduce(
                  (sum, clip) => sum + clip.outFrame - clip.inFrame,
                  0,
                ),
                fps,
              )}{" "}
              total runtime
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="text-body-sm text-on-surface-variant">
              {clips.filter((clip) => clip.status === "unreviewed").length}{" "}
              pending review
            </span>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-space-md sm:w-auto">
          <Link
            href={editorHref(activeId)}
            className="text-label-md text-on-surface-variant hover:text-on-surface hover:underline"
          >
            Or customize in Editor
          </Link>
          <button
            type="button"
            onClick={onQueue}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-label-md font-bold text-on-primary-fixed shadow-neon hover:brightness-105"
          >
            View Kept Clips ({kept.length})<Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
