import { useRef, useState, type RefObject } from "react";
import { Button, Icon } from "@/components/ui";
import type { SelectedVideo } from "@/types/welcome";

type ImportDropzoneProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  onBrowse: () => void;
  onFiles: (files: FileList) => void;
  selectedVideo: SelectedVideo | null;
  error: string | null;
};

export function ImportDropzone({
  inputRef,
  onBrowse,
  onFiles,
  selectedVideo,
  error,
}: ImportDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  return (
    <section
      aria-labelledby="import-heading"
      data-import-zone
      className={`group relative flex min-h-85 w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-container-low p-space-xl text-center shadow-xl transition-colors duration-300 hover:bg-surface-container motion-reduce:transition-none ${dragging ? "ring-2 ring-primary-container" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (--dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-44 w-80 -translate-x-1/2 rounded-full bg-primary-container/10 blur-[70px]"
      />
      <button
        type="button"
        className="absolute inset-0 rounded-xl focus-visible:-outline-offset-4"
        onClick={onBrowse}
        aria-label="Browse for a video or drop one onto this canvas"
        aria-describedby="import-description video-formats"
      />
      <div className="pointer-events-none relative mb-space-lg flex size-20 items-center justify-center rounded-xl bg-surface-container-highest text-primary-container shadow-md transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
        <Icon name="upload" size={36} />
        <span className="absolute -right-1 -bottom-1 rounded-sm bg-surface-container-lowest px-1.5 py-0.5 font-code text-label-sm text-on-surface-variant">
          LOCAL
        </span>
      </div>
      <h2
        id="import-heading"
        className="pointer-events-none relative mb-space-xs text-headline-md font-semibold text-primary"
      >
        {dragging
          ? "Drop your video to select it"
          : "Drag and drop video directly onto canvas"}
      </h2>
      <p
        id="import-description"
        className="pointer-events-none relative mb-space-lg max-w-md text-body-md text-on-surface-variant"
      >
        Supports native high-bitrate containers up to 4K resolution. Decoded
        locally using hardware acceleration.
      </p>
      <Button
        variant="primary"
        className="relative px-space-xl py-3 font-bold tracking-tight"
        onClick={onBrowse}
        aria-describedby="video-formats"
        aria-keyshortcuts="O"
      >
        <Icon name="folder" />
        <span>Choose Video File</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        hidden
        aria-label="Choose a video file"
        onChange={(event) => {
          if (event.currentTarget.files) onFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <div
        id="video-formats"
        className="pointer-events-none relative mt-space-lg flex flex-wrap items-center justify-center gap-space-xs"
      >
        {[".MP4", ".MOV", ".WEBM"].map((format) => (
          <span
            key={format}
            className="rounded-sm bg-surface-container-highest px-2 py-0.5 font-code text-label-sm text-on-surface-variant"
          >
            {format}
          </span>
        ))}
        <span className="ml-space-xs text-label-sm text-on-surface-variant">
          H.264 / ProRes / VP9
        </span>
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          selectedVideo
            ? "pointer-events-none relative mt-space-lg max-w-full text-body-sm wrap-anywhere text-tertiary-fixed"
            : "sr-only"
        }
      >
        {selectedVideo
          ? `${selectedVideo.name} selected · UI preview only. Video analysis will be connected later.`
          : ""}
      </p>
      <p
        role="alert"
        className={
          error
            ? "pointer-events-none relative mt-space-md text-body-sm text-error"
            : "sr-only"
        }
      >
        {error}
      </p>
    </section>
  );
}
