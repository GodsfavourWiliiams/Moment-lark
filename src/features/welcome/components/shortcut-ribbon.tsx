import { Icon, Kbd } from "@/components/ui";
import { EDITOR_SHORTCUTS } from "@/config/shortcuts";

export function ShortcutRibbon() {
  return (
    <footer
      className="pt-space-xs pb-space-lg"
      aria-label="Studio keyboard shortcuts"
    >
      <div className="flex flex-wrap items-center justify-between gap-space-md rounded-lg bg-surface-container-lowest px-space-md py-space-sm text-on-surface-variant">
        <span className="flex items-center gap-space-xs text-label-sm font-semibold tracking-wider text-on-surface">
          <Icon name="keyboard" size={16} className="text-primary-container" />
          SYSTEM SHORTCUTS
        </span>
        <ul className="flex flex-wrap items-center gap-space-md font-code text-label-sm">
          {EDITOR_SHORTCUTS.map(({ keys, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
