import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { cropGuide } from "@/lib/clip-geometry";
import type { ClipDocument, MediaSource } from "@/types/editing";

export type ClipCompositionProps = {
  source: MediaSource;
  clip: ClipDocument;
  startFrame: number;
  preview: boolean;
  poster: string;
  captionsVisible: boolean;
};

/** Shared by Remotion Player and the MP4 renderer. Only the framing viewport differs. */
export function ClipComposition({
  source,
  clip,
  startFrame,
  preview,
  poster,
  captionsVisible,
}: ClipCompositionProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const sourceFrame = frame + startFrame;
  const guide = preview ? cropGuide(clip.aspect) : { width, height };
  const area = {
    width: guide.width,
    height: guide.height,
    left: preview ? (width - guide.width) * clip.cropX : 0,
  };
  const scale =
    area.width /
    (clip.aspect === "9:16" || clip.aspect === "1:1" ? 1080 : 1920);
  const sourceScale = Math.max(width / source.width, height / source.height);
  const videoWidth = source.width * sourceScale;
  const videoHeight = source.height * sourceScale;
  const mediaStyle = {
    position: "absolute" as const,
    width: videoWidth,
    height: videoHeight,
    maxWidth: "none",
    left: (width - videoWidth) * clip.cropX,
    top: (height - videoHeight) / 2,
  };
  const caption = captionsVisible
    ? clip.captions.find(
        (cue) => sourceFrame >= cue.start && sourceFrame < cue.end,
      )
    : null;
  const titleFrame = sourceFrame - clip.inFrame;
  const showTitle = captionsVisible && titleFrame >= 0 && titleFrame < fps * 3;
  return (
    <AbsoluteFill className="overflow-hidden bg-black font-sans">
      {source.url ? (
        <Video src={source.url} trimBefore={startFrame} style={mediaStyle} />
      ) : (
        <Img
          src={poster}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div
        className="absolute top-0"
        style={{ left: area.left, width: area.width, height: area.height }}
      >
        {showTitle && (
          <div
            className="absolute text-center font-bold text-white"
            style={{
              top: "18%",
              left: "7.5%",
              width: "85%",
              fontSize: 60 * scale,
              lineHeight: 1.2,
              opacity: interpolate(titleFrame, [0, 8], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span
              className="rounded-lg bg-black/90"
              style={{
                padding: `${12 * scale}px ${24 * scale}px`,
                boxDecorationBreak: "clone",
              }}
            >
              {clip.title}
            </span>
          </div>
        )}
        {caption && (
          <div
            className="absolute text-center font-bold text-white"
            style={{
              bottom: "16%",
              left: "7.5%",
              width: "85%",
              fontSize: 60 * scale,
              lineHeight: 1.3,
            }}
          >
            <span
              className="inline-block rounded-lg bg-black/90"
              style={{ padding: `${16 * scale}px ${24 * scale}px` }}
            >
              {caption.text.split(/(locally)/i).map((part, index) =>
                part.toLowerCase() === "locally" ? (
                  <span
                    key={index}
                    className="text-primary-container underline decoration-2 underline-offset-4"
                  >
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
