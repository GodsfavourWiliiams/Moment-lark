import { clamp, timecode } from "@/lib/timecode";

export function TimelineHandle({
  label,
  value,
  min,
  max,
  windowStart,
  windowEnd,
  fps,
  onChange,
  playhead = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  windowStart: number;
  windowEnd: number;
  fps: number;
  onChange: (value: number) => void;
  playhead?: boolean;
}) {
  return (
    <button
      type="button"
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={timecode(value, fps, true)}
      className={`absolute inset-y-0 z-20 flex touch-none items-center justify-center bg-primary-container text-on-primary-fixed shadow-nav ${playhead ? "w-0.5 cursor-grab before:absolute before:top-0 before:size-3 before:rotate-45 before:rounded-sm before:bg-primary-container" : "w-3 cursor-ew-resize rounded-sm before:h-6 before:w-0.5 before:rounded-full before:bg-on-primary-fixed"}`}
      style={{
        left: `${((value - windowStart) / (windowEnd - windowStart)) * 100}%`,
        transform: "translateX(-50%)",
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? fps : 1;
        const next =
          event.key === "Home"
            ? min
            : event.key === "End"
              ? max
              : ["ArrowLeft", "ArrowDown"].includes(event.key)
                ? value - step
                : ["ArrowRight", "ArrowUp"].includes(event.key)
                  ? value + step
                  : event.key === "PageUp"
                    ? value + fps
                    : event.key === "PageDown"
                      ? value - fps
                      : null;
        if (next !== null) {
          event.preventDefault();
          event.stopPropagation();
          onChange(clamp(next, min, max));
        }
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const rect = event.currentTarget.parentElement!.getBoundingClientRect();
        onChange(
          clamp(
            Math.round(
              windowStart +
                ((event.clientX - rect.left) / rect.width) *
                  (windowEnd - windowStart),
            ),
            min,
            max,
          ),
        );
      }}
      onPointerUp={(event) =>
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    />
  );
}
