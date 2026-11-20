import { ClipComposition } from "@/components/media/clip-composition";
import { outputSize } from "@/lib/clip-geometry";
import type { ClipDocument, MediaSource } from "@/types/editing";

export async function exportClip(
  source: MediaSource,
  clip: ClipDocument,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
) {
  if (!source.url)
    throw new Error(
      "The local video is no longer available. Import it again to export clips.",
    );
  const { canRenderMediaOnWeb, renderMediaOnWeb } =
    await import("@remotion/web-renderer");
  const size = outputSize(clip.aspect, source);
  const support = await canRenderMediaOnWeb({
    ...size,
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
  });
  if (!support.canRender)
    throw new Error(
      support.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => issue.message)
        .join(" "),
    );
  await document.fonts.ready;
  const inputProps = {
    source,
    clip,
    startFrame: clip.inFrame,
    preview: false,
    captionsVisible: true,
  };
  const result = await renderMediaOnWeb({
    composition: {
      id: "MomentLarkClip",
      component: ClipComposition,
      ...size,
      fps: source.fps,
      durationInFrames: clip.outFrame - clip.inFrame,
      defaultProps: inputProps,
    },
    inputProps,
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    signal,
    onProgress: (event) => onProgress(event.progress),
    licenseKey: process.env.NEXT_PUBLIC_REMOTION_LICENSE_KEY ?? null,
  });
  return result.getBlob();
}
