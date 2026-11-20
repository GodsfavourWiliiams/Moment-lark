export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
export function timecode(frame: number, fps: number, precision = false) {
  const whole = Math.max(0, Math.round(frame));
  const seconds = Math.floor(whole / fps);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}${precision ? `.${pad(whole % fps)}` : ""}`;
}
export function durationLabel(frames: number, fps: number) {
  const seconds = Math.max(0, Math.round(frames / fps));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function parseTimecode(value: string, fps: number): number | null {
  const match = /^(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,2}))?$/.exec(
    value.trim(),
  );
  if (!match || Number(match[4] ?? 0) >= fps) return null;
  return (
    ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * fps +
    Number(match[4] ?? 0)
  );
}
