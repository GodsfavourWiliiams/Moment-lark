"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { PackWriter } from "@/lib/analysis/model-pack";

type FileWriter = PackWriter & {
  close: () => Promise<void>;
  abort: () => Promise<void>;
};
type SavePicker = (options: {
  suggestedName: string;
}) => Promise<{ createWritable: () => Promise<FileWriter> }>;

export function ModelTransfer({
  onChanged,
  onBusy,
}: {
  onChanged?: () => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const run = async (file?: File) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    onBusy?.(true);
    setError(false);
    setMessage(file ? "Opening model pack…" : "Preparing model export…");
    let writer: FileWriter | undefined;
    try {
      // Open the save picker during the click gesture, before importing code.
      const savePicker = (
        window as unknown as { showSaveFilePicker?: SavePicker }
      ).showSaveFilePicker;
      const handle =
        !file && savePicker
          ? await savePicker.call(window, {
              suggestedName: "moment-lark-models.mlmodels",
            })
          : undefined;
      const { exportModelPack, importModelPack } = await import(
        "@/lib/analysis/model-pack"
      );
      controller.signal.throwIfAborted();
      if (file) {
        const count = await importModelPack(
          file,
          controller.signal,
          setMessage,
        );
        setMessage(
          `Imported ${count} model files. Analysis will reuse them; any missing files still need downloading.`,
        );
      } else {
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        if (handle) writer = await handle.createWritable();
        const destination: PackWriter = writer ?? {
          write: async (bytes) => {
            chunks.push(bytes);
          },
        };
        const count = await exportModelPack(
          destination,
          controller.signal,
          setMessage,
        );
        controller.signal.throwIfAborted();
        if (writer) {
          await writer.close();
          writer = undefined;
        } else {
          const url = URL.createObjectURL(
            new Blob(chunks, { type: "application/octet-stream" }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "moment-lark-models.mlmodels";
          document.body.append(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
        setMessage(
          `Exported ${count} saved model files. Open Moment Lark in the other browser and import this pack.`,
        );
      }
    } catch (cause) {
      await writer?.abort().catch(() => {});
      if (
        controller.signal.aborted ||
        (cause instanceof Error && cause.name === "AbortError")
      )
        setMessage(
          "Transfer cancelled. Model files already saved remain available.",
        );
      else {
        setError(true);
        setMessage(
          cause instanceof Error
            ? cause.message
            : "Model transfer failed. Please retry.",
        );
      }
    } finally {
      active.current = null;
      setBusy(false);
      onBusy?.(false);
      onChanged?.();
    }
  };
  return (
    <section
      aria-label="Reuse models across browsers"
      className="rounded-lg bg-surface-container p-4 text-body-sm"
    >
      <h2 className="font-bold text-on-surface">
        Reuse models in another browser
      </h2>
      <p className="mt-2 text-on-surface-variant">
        Export from the browser and site address where your models are saved,
        then import that pack here. This copies model files only and uses no
        video slots. It does not download missing models.
      </p>
      <p className="mt-2 text-on-surface-variant">
        A complete pack is about 1.2 GB. Browsers without a save-file picker
        prepare the download in memory, so exporting may need substantial free
        memory. Import only packs you exported yourself or trust.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void run()}>
          Export models
        </Button>
        <Button disabled={busy} onClick={() => input.current?.click()}>
          Import models
        </Button>
        {busy && (
          <Button onClick={() => active.current?.abort()}>
            Cancel transfer
          </Button>
        )}
        <input
          ref={input}
          type="file"
          accept=".mlmodels"
          aria-label="Choose a Moment Lark model pack"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void run(file);
          }}
        />
      </div>
      {message && (
        <p
          className={`mt-3 ${error ? "text-error" : "text-on-surface-variant"}`}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
