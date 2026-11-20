"use client";
import { useEffect, useState } from "react";
import type { MediaSource } from "@/types/editing";

/** Sample bounded audio windows for an overview instead of decoding an entire long recording. */
export function useWaveform(source: MediaSource, start: number, end: number) {
  const [result, setResult] = useState<{ key: string; peaks: number[] } | null>(
    null,
  );
  const key = `${source.id}:${start}:${end}`;
  useEffect(() => {
    if (!source.url) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void (async () => {
      const { Input, UrlSource, ALL_FORMATS, AudioBufferSink } =
        await import("mediabunny");
      if (cancelled) return;
      const input = new Input({
        source: new UrlSource(source.url!),
        formats: ALL_FORMATS,
      });
      dispose = () => input.dispose();
      const track = await input.getPrimaryAudioTrack();
      if (!track || !(await track.canDecode())) {
        if (!cancelled) setResult({ key, peaks: Array(100).fill(0) });
        return;
      }
      const times = Array.from(
        { length: 100 },
        (_, i) => (start + ((end - start) * i) / 100) / source.fps,
      );
      const sink = new AudioBufferSink(track);
      const peaks: number[] = [];
      for await (const entry of sink.buffersAtTimestamps(times)) {
        if (cancelled) return;
        let peak = 0;
        if (entry) {
          const data = entry.buffer.getChannelData(0);
          for (let i = 0; i < data.length; i += 8)
            peak = Math.max(peak, Math.abs(data[i]));
        }
        peaks.push(peak);
      }
      if (!cancelled) setResult({ key, peaks });
    })()
      .catch(() => {
        if (!cancelled) setResult({ key, peaks: Array(100).fill(0) });
      })
      .finally(() => dispose?.());
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [source.id, source.url, source.fps, start, end, key]);
  return result?.key === key ? result.peaks : [];
}
