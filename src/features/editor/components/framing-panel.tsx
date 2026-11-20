import { Icon } from "@/components/ui";
import type { AspectRatio, ClipDocument, ClipPatch } from "@/types/editing";

export function FramingPanel({
  clip,
  onPatch,
}: {
  clip: ClipDocument;
  onPatch: (patch: ClipPatch) => void;
}) {
  return (
    <section
      aria-labelledby="framing-heading"
      className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2
          id="framing-heading"
          className="flex items-center gap-1 text-headline-md font-semibold"
        >
          <Icon name="crop" size={18} className="text-primary-fixed" />
          Target Framing
        </h2>
        <span className="text-label-sm text-on-surface-variant">
          Social Formats
        </span>
      </div>
      <div
        className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1 shadow-inner"
        role="group"
        aria-label="Output aspect ratio"
      >
        {(
          [
            { value: "16:9", label: "Original", icon: "aspect" },
            { value: "9:16", label: "Vertical", icon: "portrait" },
            { value: "1:1", label: "Square", icon: "square" },
          ] as const
        ).map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={clip.aspect === value}
            onClick={() => onPatch({ aspect: value as AspectRatio })}
            className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 text-label-md transition-colors ${clip.aspect === value ? "bg-primary-container font-bold text-on-primary-fixed shadow-nav" : "font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
          >
            <Icon name={icon} size={18} />
            {value} {label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-primary-fixed">
            <Icon name="face" size={18} />
          </span>
          <div>
            <span className="text-label-md font-semibold">
              Auto-center speaker
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Center crop · speaker tracking pending
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Center crop (speaker tracking not connected)"
          aria-checked={clip.centered}
          onClick={() =>
            onPatch({
              centered: !clip.centered,
              ...(!clip.centered ? { cropX: 0.5 } : {}),
            })
          }
          className={`relative h-6 w-11 shrink-0 rounded-full ${clip.centered ? "bg-primary-container" : "bg-surface-container-highest"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-on-primary-fixed transition-transform motion-reduce:transition-none ${clip.centered ? "translate-x-5" : ""}`}
          />
        </button>
      </div>
      {!clip.centered && (
        <label className="flex flex-col gap-1 text-body-sm text-on-surface-variant">
          Manual horizontal position
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={clip.cropX}
            onChange={(event) => onPatch({ cropX: Number(event.target.value) })}
            className="h-6 w-full accent-primary-container"
          />
        </label>
      )}
    </section>
  );
}
