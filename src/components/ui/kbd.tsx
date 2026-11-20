import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-sm bg-surface-container-highest px-1.5 py-0.5 font-code text-label-sm font-semibold whitespace-nowrap text-on-surface shadow-sm">
      {children}
    </kbd>
  );
}
