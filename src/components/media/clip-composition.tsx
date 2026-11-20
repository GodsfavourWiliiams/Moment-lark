import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { mediaRect, outputSize, previewGeometry } from "@/lib/clip-geometry";
import type { ClipDocument, MediaSource } from "@/types/editing";

export type ClipCompositionProps = {
  source: MediaSource;
  clip: ClipDocument;
  startFrame: number;
  preview: boolean;
  captionsVisible: boolean;
};

/** Shared by Remotion Player and the MP4 renderer. Only the framing viewport differs. */
export function ClipComposition({
  source,
  clip,
  startFrame,
  preview,
  captionsVisible,
}: ClipCompositionProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const sourceFrame = frame + startFrame;
  const geometry = previewGeometry(source, clip.aspect, clip.cropX, {
    width,
    height,
  });
  const area = preview ? geometry.crop : { width, height, left: 0, top: 0 };
  const target = outputSize(clip.aspect, source);
  const scale = area.width / (target.width / target.height < 1.5 ? 1080 : 1920);
  const mediaStyle = {
    position: "absolute" as const,
    ...(preview
      ? geometry.media
      : mediaRect(source, { width, height }, "cover", clip.cropX)),
    maxWidth: "none",
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
      {source.url && (
        <Video src={source.url} trimBefore={startFrame} style={mediaStyle} />
      )}

      <div className="absolute" style={area}>
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
              {caption.text}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
