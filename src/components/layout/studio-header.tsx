"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button, Icon, Kbd } from "@/components/ui";
import { BRAND } from "@/config/brand";
import { IMPORT_ROUTE, STUDIO_NAVIGATION } from "@/config/navigation";
import { useStudio } from "@/hooks/use-studio";

export function StudioHeader() {
  const studio = useStudio();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-surface-container-highest bg-surface/90 backdrop-blur-xl">
      <a
        href="#main-content"
        className="fixed top-3 left-4 z-50 -translate-y-24 rounded-lg bg-primary-container px-4 py-3 font-semibold text-on-primary-fixed focus:translate-y-0"
      >
        Skip to main content
      </a>
      <div className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-3 px-space-lg xl:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-2 py-3">
          <Link
            href={IMPORT_ROUTE}
            onClick={studio.returnToImport}
            className="group inline-flex shrink-0"
            aria-label={`${BRAND.name} home`}
          >
            <Logo />
          </Link>
          <span className="hidden rounded-sm border border-outline-variant/30 bg-surface-container-high px-1.5 py-0.5 text-label-sm font-medium tracking-wide text-on-surface-variant sm:inline-flex">
            {BRAND.version} • {BRAND.edition}
          </span>
        </div>
        <nav
          aria-label="Studio workflow"
          className="order-3 col-span-2 mb-2 overflow-x-auto xl:order-none xl:col-span-1 xl:mb-0"
        >
          <div className="flex w-max items-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1">
            {STUDIO_NAVIGATION.map((item) => {
              const active = pathname === item.href && studio.view === "import";
              const classes = `inline-flex min-h-9 items-center rounded-md px-space-md text-label-md transition-colors motion-reduce:transition-none ${active ? "bg-primary-container font-semibold text-on-primary-fixed shadow-nav" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`;
              return item.available ? (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={studio.returnToImport}
                  aria-current={active ? "page" : undefined}
                  className={classes}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.focus();
                    studio.openSection(item.id);
                  }}
                  aria-haspopup="dialog"
                  className={classes}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={studio.openShortcuts}
            aria-haspopup="dialog"
            className="gap-1.5 rounded-md border border-outline-variant/30 px-2.5 py-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <span>Shortcuts</span>
            <span className="hidden sm:inline-flex">
              <Kbd>⌘K</Kbd>
            </span>
          </Button>
          <span
            className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm sm:inline-flex"
            role="img"
            aria-label="Local workspace, no account required"
          >
            <Icon name="user" size={18} />
          </span>
        </div>
      </div>
    </header>
  );
}
