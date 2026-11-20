"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CallbackListener, PlayerRef } from "@remotion/player";
import { clamp } from "@/lib/timecode";

export function useClipPlayer(initialFrame: number, maxFrame: number) {
  const ref = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(initialFrame);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    const onFrame: CallbackListener<"frameupdate"> = (event) =>
      setFrame(event.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError: CallbackListener<"error"> = (event) => {
      setError(event.detail.error.message);
      setPlaying(false);
    };
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    player.addEventListener("error", onError);
    player.setVolume(0.75);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
      player.removeEventListener("error", onError);
    };
  }, []);
  const seek = useCallback(
    (next: number) => {
      const target = clamp(Math.round(next), 0, maxFrame - 1);
      ref.current?.seekTo(target);
      setFrame(target);
    },
    [maxFrame],
  );
  const changeVolume = (value: number) => {
    ref.current?.setVolume(value);
    setVolume(value);
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void containerRef.current
        ?.requestFullscreen()
        .catch(() => setError("Fullscreen is not available in this browser."));
  };
  return {
    attachPlayer: useCallback((instance: PlayerRef | null) => {
      ref.current = instance;
    }, []),
    attachContainer: useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
    }, []),
    frame,
    playing,
    volume,
    error,
    seek,
    changeVolume,
    fullscreen,
    toggle: () => ref.current?.toggle(),
    pause: () => ref.current?.pause(),
  };
}
export type ClipPlayer = ReturnType<typeof useClipPlayer>;
