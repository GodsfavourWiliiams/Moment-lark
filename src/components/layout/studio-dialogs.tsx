"use client";

import { Button, Dialog, Kbd } from "@/components/ui";
import { getStudioSection } from "@/config/navigation";
import { EDITOR_SHORTCUTS } from "@/config/shortcuts";
import { useStudio } from "@/hooks/use-studio";

export function StudioDialogs() {
  const { dialog, closeDialog, view } = useStudio();
  const section =
    dialog?.kind === "section" ? getStudioSection(dialog.section) : null;
  return (
    <Dialog
      open={dialog !== null}
      onClose={closeDialog}
      title={section ? `${section.label} workspace` : "Keyboard shortcuts"}
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
        ) : (
          <>
            <p>
              The {section?.label.toLowerCase()} screen will be connected in the
              next phase.
            </p>
            <p>
              You can review kept clips and export a local video from the queue
              inside Suggestions or Editor. The dedicated workspace design is
              still pending.
            </p>
            <Button onClick={closeDialog}>Back to workspace</Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
