"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-surface-container-highest bg-surface-container p-0 text-on-surface shadow-xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="p-space-xl">
        <div className="mb-space-lg flex items-center justify-between gap-space-lg">
          <h2
            id={titleId}
            className="text-headline-md font-semibold text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-high transition-colors hover:bg-surface-container-highest motion-reduce:transition-none"
            onClick={onClose}
            aria-label="Close dialog"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
