import { Icon } from "@/components/ui";
import type { ClipDocument } from "@/types/editing";
import type { QueueFilter, QueueSort } from "@/types/export";
const filters = [
  { id: "all", label: "All" },
  { id: "9:16", label: "9:16 Vertical" },
  { id: "original", label: "Original" },
  { id: "1:1", label: "1:1 Square" },
] as const;
export function QueueFilters({
  clips,
  filter,
  sort,
  onFilter,
  onSort,
}: {
  clips: ClipDocument[];
  filter: QueueFilter;
  sort: QueueSort;
  onFilter: (filter: QueueFilter) => void;
  onSort: (sort: QueueSort) => void;
}) {
  return (
    <nav
      aria-label="Queue filters"
      className="flex flex-wrap items-center justify-between gap-space-md rounded-lg bg-surface-container px-space-md py-2.5"
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 hidden text-label-sm tracking-wider text-on-surface-variant uppercase sm:inline">
          Filter:
        </span>
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => onFilter(item.id)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded px-space-md text-label-md transition-colors ${filter === item.id ? "bg-surface-container-highest text-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}`}
          >
            {item.id !== "all" && (
              <Icon
                name={
                  item.id === "9:16"
                    ? "portrait"
                    : item.id === "1:1"
                      ? "square"
                      : "aspect"
                }
                size={16}
                className={
                  item.id === "original"
                    ? "text-tertiary-fixed-dim"
                    : "text-secondary"
                }
              />
            )}
            {item.label}
            <span className="rounded-full bg-surface-container-lowest px-1.5 text-label-sm text-primary-fixed">
              {
                clips.filter(
                  (clip) => item.id === "all" || clip.aspect === item.id,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-space-md">
        <label className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          Sort by:
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as QueueSort)}
            className="min-h-9 max-w-full rounded bg-surface-container-lowest px-2 text-label-md text-on-surface"
          >
            <option value="timeline">Timeline Position</option>
            <option value="shortest">Duration (Shortest First)</option>
            <option value="longest">Duration (Longest First)</option>
            <option value="score">AI Confidence Score</option>
          </select>
        </label>
        <span className="hidden items-center gap-1 text-label-sm text-on-surface-variant md:flex">
          <span className="size-2 rounded-full bg-tertiary-container" />
          Queue Ready
        </span>
      </div>
    </nav>
  );
}
