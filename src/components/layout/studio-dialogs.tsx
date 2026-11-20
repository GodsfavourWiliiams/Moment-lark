"use client";

import { Dialog, Kbd } from "@/components/ui";
import { EDITOR_SHORTCUTS } from "@/config/shortcuts";
import { useStudio } from "@/hooks/use-studio";

export function StudioDialogs() {
  const { dialog, closeDialog, view } = useStudio();
  return (
    <Dialog
      open={dialog !== null}
      onClose={closeDialog}
      title="Keyboard shortcuts"
    >
      <div className="flex flex-col gap-space-lg text-body-md text-on-surface-variant">
        {dialog?.kind === "shortcuts" ? (
          <>
            <p>Available in the studio</p>
            <dl className="space-y-space-md">
              {view === "import" && (
                <div className="flex items-center justify-between gap-4">
                  <dt>Choose video while the upload area is focused</dt>
                  <dd>
                    <Kbd>O</Kbd>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt>Open shortcuts</dt>
                <dd>
                  <Kbd>⌘ / Ctrl + K</Kbd>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Close dialog</dt>
                <dd>
                  <Kbd>Esc</Kbd>
                </dd>
              </div>
            </dl>
            <h3 className="text-body-lg font-semibold text-primary">
              Editor shortcuts
            </h3>
            <p>
              Single-letter shortcuts work while the editor workspace has focus.
              Text fields keep their normal editing keys.
            </p>
            <dl className="space-y-space-md">
              {EDITOR_SHORTCUTS.map(({ keys, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4"
                >
                  <dt>{label}</dt>
                  <dd className="flex gap-1">
                    {keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
