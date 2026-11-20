import { Button, Dialog, Kbd } from "@/components/ui";
import { editorShortcuts } from "../data/workflow";
import type { WelcomeDialog } from "@/types/welcome";

type WelcomeDialogsProps = { dialog: WelcomeDialog; onClose: () => void };

export function WelcomeDialogs({ dialog, onClose }: WelcomeDialogsProps) {
  const title =
    dialog === "shortcuts"
      ? "Keyboard shortcuts"
      : dialog === "sample"
        ? "Sample analysis preview"
        : `${dialog ?? "Studio"} workspace`;
  return (
    <Dialog open={dialog !== null} onClose={onClose} title={title}>
      <div className="flex flex-col gap-space-lg text-body-md text-on-surface-variant">
        {dialog === "shortcuts" ? (
          <>
            <p>Available on this screen</p>
            <dl className="space-y-space-md">
              <div className="flex items-center justify-between gap-space-lg">
                <dt>Choose video while the upload area is focused</dt>
                <dd>
                  <Kbd>O</Kbd>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-space-lg">
                <dt>Open shortcuts</dt>
                <dd>
                  <Kbd>⌘ / Ctrl + K</Kbd>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-space-lg">
                <dt>Close dialog</dt>
                <dd>
                  <Kbd>Esc</Kbd>
                </dd>
              </div>
            </dl>
            <h3 className="text-body-lg font-semibold text-primary">
              Editor shortcuts · coming with integration
            </h3>
            <dl className="space-y-space-md">
              {editorShortcuts.map(({ keys, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-space-lg"
                >
                  <dt>{label}</dt>
                  <dd className="flex gap-space-xs">
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
              {dialog === "sample"
                ? "This is the sample analysis entry point. The waveform and video details are presentation data; no video has been analyzed."
                : `The ${dialog?.toLowerCase()} screen will be connected in the next phase.`}
            </p>
            <p>
              This build is a UI preview. Media processing, storage, and export
              integrations are not connected yet.
            </p>
            <Button onClick={onClose}>Back to import</Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
