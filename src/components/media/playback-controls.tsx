import { MediaButton } from "./media-button";
import { MediaRange } from "./media-range";
import type { ClipPlayer } from "@/hooks/use-clip-player";
import { timecode } from "@/lib/timecode";
import type { ClipDocument, MediaSource } from "@/types/editing";

export function PlaybackControls({
  player,
  source,
  clip,
  editor,
  onAspect,
}: {
  player: Omit<ClipPlayer, "attachPlayer" | "attachContainer">;
  source: MediaSource;
  clip: ClipDocument;
  editor: boolean;
  onAspect: () => void;
}) {
  const jump = editor ? 5 : 10;
  const back = (
    <MediaButton
      icon="backward"
      label={`Jump back ${jump} seconds`}
      onClick={() => player.seek(player.frame - source.fps * jump)}
    />
  );
  const play = (
    <MediaButton
      icon={player.playing ? "pause" : "play"}
      label={player.playing ? "Pause" : "Play"}
      onClick={player.toggle}
      variant="primary"
      size={editor ? "lg" : "md"}
    />
  );
  return (
    <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent px-space-md py-space-sm">
      <div className="flex flex-wrap items-center gap-space-sm">
        {editor ? (
          <>
            {back}
            {play}
          </>
        ) : (
          <>
            {play}
            {back}
          </>
        )}
        <MediaButton
          icon="forward"
          label={`Jump forward ${jump} seconds`}
          onClick={() => player.seek(player.frame + source.fps * jump)}
        />
        <div
          className={`ml-1 flex items-center gap-1.5 whitespace-nowrap font-code text-code-timecode tabular-nums ${editor ? "rounded-md bg-surface-container-high px-3 py-1.5 shadow-inner" : ""}`}
        >
          <span className="font-semibold text-primary-fixed">
            {timecode(player.frame, source.fps, editor)}
          </span>
          <span className="text-on-surface-variant/60">/</span>
          <span className="text-on-surface-variant">
            {timecode(
              editor ? clip.outFrame : source.durationInFrames,
              source.fps,
              editor,
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MediaButton
          icon={player.volume === 0 ? "muted" : "volume"}
          label={player.volume === 0 ? "Unmute" : "Mute"}
          onClick={() => player.changeVolume(player.volume ? 0 : 0.75)}
        />
        <MediaRange
          label="Preview volume"
          max={1}
          step={0.01}
          value={player.volume}
          onChange={player.changeVolume}
          className="w-16"
          stereo={editor}
        />
        {!editor && (
          <>
            <MediaButton
              icon="aspect"
              label="Change preview aspect ratio"
              onClick={onAspect}
            />
            <MediaButton
              icon="fullscreen"
              label="Fullscreen preview"
              onClick={player.fullscreen}
            />
          </>
        )}
      </div>
    </div>
  );
}
