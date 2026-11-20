import Link from "next/link";
import { Icon, Kbd } from "@/components/ui";
import { editorHref } from "@/config/navigation";
import type { ClipDocument } from "@/types/editing";

export function EditorActions({
  clip,
  keptCount,
  next,
  onKeep,
  onDiscard,
  onQueue,
}: {
  clip: ClipDocument;
  keptCount: number;
  next?: ClipDocument;
  onKeep: () => void;
  onDiscard: () => void;
  onQueue: () => void;
}) {
  return (
    <section
      aria-label="Clip actions"
      className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-lg"
    >
      <button
        type="button"
        onClick={onKeep}
        className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-primary-container px-4 py-3.5 text-headline-md font-bold text-on-primary-fixed shadow-neon transition-transform hover:brightness-105 active:scale-[.99]"
      >
        <Icon name="check" size={22} />
        <span>
          {clip.status === "kept"
            ? "Clip Kept in Queue"
            : "Keep Clip & Add to Queue"}
        </span>
        <Kbd className="ml-2 bg-on-primary-fixed/15 text-on-primary-fixed">
          Enter
        </Kbd>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            document.getElementById("clip-in-field")?.focus();
            document
              .getElementById("trim-heading")
              ?.scrollIntoView({ block: "center", behavior: "instant" });
          }}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-surface-container px-2 py-2.5 text-label-md font-semibold hover:bg-surface-container-high"
        >
          <Icon name="sliders" size={16} />
          Adjust manually
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-surface-container px-2 py-2.5 text-label-md text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
        >
          <Icon name="trash" size={16} />
          Discard suggestion
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onQueue}
          className="flex items-center gap-1.5 py-1 text-body-sm text-on-surface-variant hover:text-on-surface"
        >
          <span className="size-2 rounded-full bg-primary-fixed" />
          <span>
            <strong className="font-semibold text-on-surface">
              {keptCount} clip{keptCount === 1 ? "" : "s"}
            </strong>{" "}
            currently kept in queue
          </span>
        </button>
        {next ? (
          <Link
            href={editorHref(next.id)}
            className="inline-flex items-center gap-0.5 text-label-md font-semibold text-primary-fixed hover:underline"
          >
            Next suggestion
            <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onQueue}
            className="text-label-md text-primary-fixed hover:underline"
          >
            View kept clips
          </button>
        )}
      </div>
    </section>
  );
}
