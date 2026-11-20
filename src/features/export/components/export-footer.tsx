import Link from "next/link";
import { Icon } from "@/components/ui";
import { getStudioSection } from "@/config/navigation";
import { formatBytes } from "@/lib/clip-queue";
export function ExportFooter({
  count,
  bytes,
  sourceId,
  archiving,
  error,
  onDownload,
}: {
  count: number;
  bytes: number;
  sourceId: string;
  archiving: boolean;
  error: string;
  onDownload: () => void;
}) {
  return (
    <>
      <div className="flex flex-col items-center justify-between gap-space-lg rounded-xl bg-surface-container-low p-space-lg shadow-md md:flex-row">
        <div className="flex max-w-2xl items-start gap-space-md">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
            <Icon name="shield" size={22} className="text-primary-fixed" />
          </span>
          <div>
            <h2 className="text-label-md font-semibold text-primary">
              Zero Media Uploads • Local Video Rendering
            </h2>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              Video rendering takes place inside this browser tab. Your media is
              not uploaded to a cloud render queue. Keep this session open until
              you have downloaded your finished clips.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!count || archiving}
          onClick={onDownload}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3 text-label-md font-bold text-on-primary-fixed shadow-neon hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          <Icon name="zip" size={20} />
          {archiving ? "Preparing ZIP…" : "Download All Finished Clips (.ZIP)"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
      <footer className="flex flex-col items-center justify-between gap-space-md border-t border-surface-container-highest/50 pt-space-md text-label-md text-on-surface-variant sm:flex-row">
        <div className="flex flex-wrap items-center gap-space-lg">
          <Link
            href={getStudioSection("suggestions").href}
            className="flex items-center gap-1 py-2 hover:text-primary"
          >
            <Icon name="back" size={18} />
            Back to Suggestions
          </Link>
          <Link
            href={getStudioSection("clips").href}
            className="flex items-center gap-1 py-2 hover:text-primary"
          >
            <Icon name="movie" size={18} />
            Back to Clips Queue
          </Link>
        </div>
        <p className="flex flex-wrap gap-2 font-code text-body-sm">
          <span>Session: {sourceId.slice(0, 12)}</span>
          <span>•</span>
          <span>Rendered files: {formatBytes(bytes)}</span>
        </p>
      </footer>
    </>
  );
}
