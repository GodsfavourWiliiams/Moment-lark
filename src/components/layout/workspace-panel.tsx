import type { ComponentPropsWithoutRef } from "react";

/** Each desktop pane owns its scrolling; the surrounding workspace stays docked. */
export function WorkspacePane({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      tabIndex={0}
      className={`flex min-w-0 flex-col gap-space-md focus-visible:-outline-offset-2 xl:min-h-0 xl:overflow-y-auto xl:overscroll-y-contain xl:[&>*]:shrink-0 ${className}`}
      {...props}
    />
  );
}
