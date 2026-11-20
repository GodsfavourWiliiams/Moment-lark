"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button, Kbd } from "@/components/ui";
import { BRAND } from "@/config/brand";
import { IMPORT_ROUTE, STUDIO_NAVIGATION } from "@/config/navigation";
import { useWorkflow } from "@/hooks/use-workflow";
import { useStudio } from "@/hooks/use-studio";

export function StudioHeader() {
  const studio = useStudio();
  const workflow = useWorkflow();
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
        </div>
        <nav
          aria-label="Studio workflow"
          className="order-3 col-span-2 mb-2 overflow-x-auto xl:order-0 xl:col-span-1 xl:mb-0"
        >
          <div className="flex w-max items-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-1">
            {STUDIO_NAVIGATION.filter((item) => workflow.canOpen(item.id)).map(
              (item) => {
                const active = pathname === item.href;
                const classes = `inline-flex min-h-9 items-center rounded-lg px-space-md text-label-md transition-colors motion-reduce:transition-none ${active ? "bg-primary-container font-semibold text-on-primary-fixed shadow-nav" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={
                      item.id === "import" ? studio.returnToImport : undefined
                    }
                    aria-current={active ? "page" : undefined}
                    className={classes}
                  >
                    {item.label}
                  </Link>
                );
              },
            )}
          </div>
        </nav>
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={studio.openShortcuts}
            aria-haspopup="dialog"
            className="gap-1.5 rounded-xl border border-outline-variant/30 px-2.5 py-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <span>Shortcuts</span>
            <span className="hidden sm:inline-flex">
              <Kbd>⌘K</Kbd>
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
