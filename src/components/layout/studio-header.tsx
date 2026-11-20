import Link from "next/link";
import { Button, Icon, Kbd } from "@/components/ui";
import type { StudioSection } from "@/types/welcome";

const sections: StudioSection[] = ["Suggestions", "Editor", "Clips", "Export"];

type HeaderProps = {
  onShortcuts: () => void;
  onNavigate: (section: StudioSection) => void;
};

export function StudioHeader({ onShortcuts, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-container-highest bg-surface/90 backdrop-blur-xl">
      <a
        href="#main-content"
        className="fixed top-3 left-4 z-50 -translate-y-24 rounded-lg bg-primary-container px-4 py-3 font-semibold text-on-primary-fixed focus:translate-y-0"
      >
        Skip to main content
      </a>
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-space-lg px-space-lg md:flex-nowrap">
        <Link
          href="/"
          aria-label="ClipFlow home"
          className="flex shrink-0 items-center gap-space-md py-space-md"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-fixed">
            <Icon name="scissors" size={24} />
          </span>
          <span className="text-headline-md font-bold tracking-tight text-primary">
            ClipFlow
          </span>
          <span className="-ml-2 rounded-sm border border-outline-variant/30 bg-surface-container-high px-space-xs py-0.5 text-label-sm text-on-surface-variant">
            v1.2
          </span>
        </Link>
        <nav
          aria-label="Studio workflow"
          className="order-3 mb-space-sm w-full overflow-x-auto md:order-none md:mb-0 md:w-auto md:mr-auto"
        >
          <div className="flex w-max items-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1">
            <a
              href="#main-content"
              aria-current="page"
              className="inline-flex min-h-9 items-center rounded-md bg-primary-container px-space-md text-label-md font-semibold text-on-primary-fixed shadow-nav"
            >
              Import
            </a>
            {sections.map((section) => (
              <button
                key={section}
                type="button"
                onClick={(event) => {
                  event.currentTarget.focus();
                  onNavigate(section);
                }}
                aria-haspopup="dialog"
                className="min-h-9 rounded-md px-space-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface motion-reduce:transition-none"
              >
                {section}
              </button>
            ))}
          </div>
        </nav>
        <Button
          onClick={onShortcuts}
          aria-haspopup="dialog"
          className="shrink-0 gap-space-xs rounded-md border border-outline-variant/30 px-space-sm py-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <span>Shortcuts</span>
          <span className="hidden lg:inline-flex">
            <Kbd>⌘K</Kbd>
          </span>
        </Button>
      </div>
    </header>
  );
}
