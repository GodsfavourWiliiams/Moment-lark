"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { DeviceProcessingNote } from "@/components/media/device-processing-note";
import { getStudioSection } from "@/config/navigation";
export function QueueActions({
  total,
  selected,
  onSelectAll,
  onCreate,
  onExport,
}: {
  total: number;
  selected: number;
  onSelectAll: () => void;
  onCreate: () => void;
  onExport: () => void;
}) {
  const checkbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkbox.current)
      checkbox.current.indeterminate = selected > 0 && selected < total;
  }, [selected, total]);
  return (
    <section
      aria-label="Batch actions"
      className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md lg:p-space-lg"
    >
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-space-md">
          <label className="flex min-h-9 cursor-pointer items-center gap-2 text-label-md">
            <input
              ref={checkbox}
              type="checkbox"
              checked={total > 0 && total === selected}
              disabled={!total}
              onChange={onSelectAll}
              className="size-4 accent-primary-container"
            />
            Select All ({total})
          </label>
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded bg-surface-container px-3 py-2 text-label-md hover:bg-surface-container-high"
          >
            <Icon name="edit" size={18} className="text-primary-fixed" />+
            Create Manual Clip (Back to Editor)
          </button>
          <Link
            href={getStudioSection("suggestions").href}
            className="flex items-center gap-1.5 rounded px-3 py-2 text-label-md hover:bg-surface-container-high"
          >
            <Icon name="sparkles" size={18} className="text-secondary" />
            Add More from AI Suggestions
          </Link>
        </div>
        <button
          type="button"
          disabled={!selected}
          onClick={onExport}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-headline-md font-bold text-on-primary-fixed shadow-neon hover:bg-primary-fixed-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proceed to Export ({selected} {selected === 1 ? "Clip" : "Clips"})
          <Icon name="arrow" size={22} />
        </button>
      </div>
      <DeviceProcessingNote />
    </section>
  );
}
