import { Waveform } from "@/components/media/waveform";
import { TimelineHandle } from "@/components/media/timeline-handle";
import { useWaveform } from "@/hooks/use-waveform";
import { timecode } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";

export function SourceTimeline({
  source,
  clips,
  activeId,
  frame,
  onSeek,
  onSelect,
}: {
  source: MediaSource;
  clips: ClipDocument[];
  activeId: string;
  frame: number;
  onSeek: (frame: number) => void;
  onSelect: (id: string) => void;
}) {
  const peaks = useWaveform(source, 0, source.durationInFrames);
  const ticks =
    source.kind === "demo"
      ? [0, 600, 1200, 1800, 2400, 2535].map((time) => time * source.fps)
      : Array.from({ length: 6 }, (_, i) => (source.durationInFrames * i) / 5);
  return (
    <section
      aria-label="Full source timeline"
      className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-body-md font-semibold">Full Source Timeline</h2>
          <span className="rounded bg-surface-container-highest px-1 py-0.5 font-code text-label-sm text-on-surface-variant">
            00:00 → {timecode(source.durationInFrames, source.fps).slice(3)}
          </span>
        </div>
        <span className="text-label-sm text-on-surface-variant">
          {clips.length}{" "}
          {source.kind === "demo" ? "Detected Key Regions" : "Manual Region"}
        </span>
      </div>
      <div className="relative h-14 rounded-lg bg-surface-container-lowest p-1">
        <div className="absolute inset-x-1 bottom-1 h-8">
          <Waveform
            variant="source"
            peaks={peaks}
            className="text-surface-container-high opacity-70"
          />
        </div>
        {clips.map((clip) => (
          <button
            key={clip.id}
            type="button"
            title={`Clip #${clip.ordinal}: ${clip.title}`}
            aria-label={`Select clip ${clip.ordinal}, ${timecode(clip.inFrame, source.fps)} to ${timecode(clip.outFrame, source.fps)}`}
            aria-pressed={clip.id === activeId}
            onClick={() => onSelect(clip.id)}
            className={`absolute inset-y-1 z-10 min-w-3 rounded border-t-4 ${clip.id === activeId ? "border-primary-container bg-primary-container/25 ring-1 ring-primary-container" : "border-secondary bg-surface-container-highest/60 hover:bg-surface-container-highest"}`}
            style={{
              left: `${(clip.inFrame / source.durationInFrames) * 100}%`,
              width: `${((clip.outFrame - clip.inFrame) / source.durationInFrames) * 100}%`,
            }}
          />
        ))}
        <TimelineHandle
          label="Source playhead"
          value={frame}
          min={0}
          max={source.durationInFrames - 1}
          windowStart={0}
          windowEnd={source.durationInFrames}
          fps={source.fps}
          onChange={onSeek}
          playhead
        />
      </div>
      <div className="flex justify-between gap-1 pt-0.5 font-code text-[10px] text-on-surface-variant sm:text-label-sm">
        {ticks.map((tick, i) => (
          <span key={i}>{timecode(tick, source.fps)}</span>
        ))}
      </div>
    </section>
  );
}
