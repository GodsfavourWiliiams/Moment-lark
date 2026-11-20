"use client";
import { Player } from "@remotion/player";
import { useState } from "react";
import type { ClipPlayer } from "@/hooks/use-clip-player";
import type { ClipDocument, MediaSource } from "@/types/editing";
import { ClipComposition } from "./clip-composition";
import { CropGuides } from "./crop-guides";
import { PlaybackControls } from "./playback-controls";
import { MediaButton } from "./media-button";
import { MediaRange } from "./media-range";
import { PREVIEW_SIZE } from "@/lib/clip-geometry";

export function VideoPreview({
  source,
  clip,
  player: { attachPlayer, attachContainer, ...controls },
  editor = false,
  autoPlay = false,
  onSettings,
  onAspect,
}: {
  source: MediaSource;
  clip: ClipDocument;
  player: ClipPlayer;
  editor?: boolean;
  autoPlay?: boolean;
  onSettings: () => void;
  onAspect: () => void;
}) {
  const [guides, setGuides] = useState(true);
  const [grid, setGrid] = useState(false);
  const [zoom, setZoom] = useState(false);
  const reframed = clip.aspect !== "original";
  const showCropGuides = reframed && guides;
  return (
    <div
      ref={attachContainer}
      className="relative flex w-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl fullscreen:justify-center"
      aria-label="Video preview"
    >
      <div
        className={`z-20 flex min-h-10 flex-wrap items-center justify-between gap-2 bg-surface-container-lowest/80 px-space-md py-space-xs backdrop-blur-md ${editor ? "relative" : "relative sm:absolute sm:inset-x-0 sm:top-0"}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-label-sm ${editor ? "bg-surface-container-highest text-on-surface-variant" : "bg-primary-container font-semibold text-on-primary-fixed"}`}
          >
            <span
              className={`size-1.5 rounded-full ${editor ? "bg-primary-container" : "bg-on-primary-fixed"}`}
            />
            {editor
              ? reframed
                ? `${clip.aspect} Crop Guides ${showCropGuides ? "ON" : "OFF"}`
                : "Original · No crop"
              : `CLIP ${String(clip.ordinal).padStart(2, "0")} PREVIEW`}
          </span>
          <span
            className="hidden max-w-65 truncate text-body-sm text-on-surface-variant sm:inline"
            title={source.name}
          >
            {editor ? "Source: Local file" : source.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!editor && (
            <span className="hidden rounded bg-surface-container px-1 py-0.5 text-label-sm text-on-surface-variant sm:inline">
              {source.height}p • {source.fps}fps
            </span>
          )}
          <MediaButton
            icon={editor ? "grid" : "portrait"}
            label={
              editor
                ? "Toggle grid overlay"
                : reframed
                  ? "Toggle crop guides"
                  : "Crop guides off · Original format"
            }
            disabled={!editor && !reframed}
            aria-pressed={editor ? grid : showCropGuides}
            onClick={() => (editor ? setGrid(!grid) : setGuides(!guides))}
            size="sm"
            variant="ghost"
          />
          <MediaButton
            icon={editor ? "frame" : "sliders"}
            label={editor ? "Zoom preview" : "Preview settings"}
            onClick={() => (editor ? setZoom(!zoom) : onSettings())}
            size="sm"
            variant="ghost"
          />
          {editor && (
            <MediaButton
              icon="fullscreen"
              label="Fullscreen preview"
              onClick={controls.fullscreen}
              size="sm"
              variant="ghost"
            />
          )}
        </div>
      </div>
      <div className="relative">
        <div
          className={`relative aspect-video w-full overflow-hidden ${zoom ? "[&_.remotion-player]:scale-125" : ""}`}
        >
          <Player
            ref={attachPlayer}
            component={ClipComposition}
            inputProps={{
              source,
              clip,
              startFrame: 0,
              preview: true,
              captionsVisible: editor,
            }}
            durationInFrames={source.durationInFrames}
            fps={source.fps}
            compositionWidth={PREVIEW_SIZE.width}
            compositionHeight={PREVIEW_SIZE.height}
            initialFrame={controls.frame}
            inFrame={editor ? clip.inFrame : undefined}
            outFrame={editor ? clip.outFrame - 1 : undefined}
            controls={false}
            autoPlay={autoPlay}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            className="remotion-player h-full w-full"
            style={{ width: "100%", height: "100%" }}
            errorFallback={({ error }) => (
              <div
                role="alert"
                className="flex h-full items-center justify-center bg-surface-container-lowest p-6 text-body-md text-error"
              >
                Cannot preview this video: {error.message}
              </div>
            )}
          />
          {(showCropGuides || grid) && (
            <CropGuides
              clip={clip}
              source={source}
              editor={editor}
              grid={grid}
            />
          )}
        </div>
        {editor && (
          <div className="relative sm:absolute sm:inset-x-0 sm:bottom-0">
            <PlaybackControls
              player={controls}
              source={source}
              clip={clip}
              editor
              onAspect={onAspect}
            />
          </div>
        )}
        {!editor && (
          <div className="relative sm:absolute sm:inset-x-0 sm:bottom-0">
            <MediaRange
              max={source.durationInFrames - 1}
              step={1}
              value={controls.frame}
              onChange={controls.seek}
              label="Seek source video"
              className="mx-3 w-[calc(100%-1.5rem)]"
            />
            <PlaybackControls
              player={controls}
              source={source}
              clip={clip}
              editor={false}
              onAspect={onAspect}
            />
          </div>
        )}
      </div>
      {controls.error && (
        <p role="alert" className="px-3 py-2 text-body-sm text-error">
          {controls.error}
        </p>
      )}
    </div>
  );
}
