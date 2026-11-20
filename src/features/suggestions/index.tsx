"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { VideoPreview } from "@/components/media/video-preview";
import { MediaSettings } from "@/components/media/media-settings";
import { KeptQueue } from "@/components/media/kept-queue";
import { editorHref } from "@/config/navigation";
import { useEditing } from "@/hooks/use-editing";
import { useClipPlayer } from "@/hooks/use-clip-player";
import { timecode, durationLabel } from "@/lib/timecode";
import type { ClipDocument, SuggestionFilter } from "@/types/editing";
import { SuggestionCard } from "./components/suggestion-card";
import { SourceTimeline } from "./components/source-timeline";
import { DecisionBar } from "./components/decision-bar";

export function SuggestionsPage() {
  const editing = useEditing();
  const [activeId, setActiveId] = useState("1");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [filter, setFilter] = useState<SuggestionFilter>("all");
  const [queue, setQueue] = useState(false);
  const [settings, setSettings] = useState(false);
  const clips = editing.document.clips.filter(
    (clip) => clip.status !== "dismissed",
  );
  const active = clips.find((clip) => clip.id === activeId) ?? clips[0];
  const shown = clips.filter(
    (clip) => filter === "all" || clip.status === filter,
  );
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="grid w-full flex-1 items-start gap-space-lg px-space-lg py-space-md xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {active ? (
          <SuggestionPreview
            key={`${editing.document.source.id}-${active.id}-${previewVersion}`}
            clip={active}
            replay={previewVersion > 0}
            onSelect={setActiveId}
            onSettings={() => setSettings(true)}
          />
        ) : (
          <div className="rounded-xl bg-surface-container-low p-8 text-center">
            <h2 className="text-headline-lg">All suggestions reviewed</h2>
            <p className="mt-2 text-on-surface-variant">
              Undo a dismissal to bring a moment back.
            </p>
            <button
              type="button"
              onClick={() => editing.dispatch({ type: "undo" })}
              className="mt-4 rounded-lg bg-primary-container px-4 py-2 text-on-primary-fixed"
              disabled={!editing.past.length}
            >
              Undo last change
            </button>
          </div>
        )}
        <section
          aria-labelledby="suggestions-heading"
          className="flex min-w-0 flex-col gap-space-md"
        >
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1
                  id="suggestions-heading"
                  className="text-headline-lg font-bold"
                >
                  Clip Suggestions
                </h1>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  {editing.document.source.kind === "demo"
                    ? "4 moments identified from speech and visual cues on your device"
                    : "Manual clip from your local recording. Analysis is not connected yet."}
                </p>
              </div>
              <span className="shrink-0 rounded bg-surface-container-high px-1 py-1 text-label-sm">
                {editing.document.source.kind === "demo"
                  ? "Demo Suggestions"
                  : "Local File"}
              </span>
            </div>
            <div
              className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-container-lowest p-1"
              role="group"
              aria-label="Filter suggestions"
            >
              {(["all", "unreviewed", "kept"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`min-h-8 rounded-md px-space-md py-1 text-label-md ${filter === value ? "bg-surface-container-highest font-semibold text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  {value === "all"
                    ? "All"
                    : value === "kept"
                      ? "Kept"
                      : "Unreviewed"}{" "}
                  (
                  {
                    clips.filter(
                      (clip) => value === "all" || clip.status === value,
                    ).length
                  }
                  )
                </button>
              ))}
              {editing.past.length > 0 && (
                <button
                  type="button"
                  onClick={() => editing.dispatch({ type: "undo" })}
                  className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-label-sm text-primary-fixed"
                >
                  <Icon name="history" size={14} />
                  Undo
                </button>
              )}
            </div>
          </div>
          {shown.map((clip) => (
            <SuggestionCard
              key={clip.id}
              clip={clip}
              selected={active?.id === clip.id}
              fps={editing.document.source.fps}
              onPreview={() => {
                setActiveId(clip.id);
                setPreviewVersion((version) => version + 1);
              }}
              onKeep={() =>
                editing.dispatch({
                  type: "review",
                  id: clip.id,
                  status: clip.status === "kept" ? "unreviewed" : "kept",
                })
              }
              onDismiss={() =>
                editing.dispatch({
                  type: "review",
                  id: clip.id,
                  status: "dismissed",
                })
              }
            />
          ))}
          {!shown.length && (
            <p
              role="status"
              className="rounded-xl bg-surface-container p-6 text-on-surface-variant"
            >
              {filter === "kept"
                ? "No clips kept yet. Keep a suggestion to add it here."
                : "No suggestions in this filter."}
            </p>
          )}
        </section>
      </div>
      <DecisionBar
        clips={editing.document.clips}
        fps={editing.document.source.fps}
        activeId={active?.id ?? "1"}
        onQueue={() => setQueue(true)}
      />
      <p role="status" className="sr-only">
        {editing.announcement}
      </p>
      <KeptQueue open={queue} onClose={() => setQueue(false)} />
      <MediaSettings
        open={settings}
        onClose={() => setSettings(false)}
        clip={active}
      />
    </div>
  );
}

function SuggestionPreview({
  clip,
  replay,
  onSelect,
  onSettings,
}: {
  clip: ClipDocument;
  replay: boolean;
  onSelect: (id: string) => void;
  onSettings: () => void;
}) {
  const { document, dispatch } = useEditing();
  const source = document.source;
  const initial = replay
    ? clip.inFrame
    : Math.min(clip.outFrame - 1, clip.inFrame + 33 * source.fps);
  const player = useClipPlayer(initial, source.durationInFrames);
  // This preview and the editor use the same Remotion composition and clip document.
  return (
    <section
      aria-label="Suggestion preview"
      className="flex min-w-0 flex-col gap-space-md"
    >
      <VideoPreview
        source={source}
        clip={clip}
        player={player}
        autoPlay={replay}
        onSettings={onSettings}
        onAspect={() =>
          dispatch({
            type: "patch",
            id: clip.id,
            patch: {
              aspect:
                clip.aspect === "9:16"
                  ? "1:1"
                  : clip.aspect === "1:1"
                    ? "16:9"
                    : "9:16",
            },
          })
        }
      />
      <SourceTimeline
        source={source}
        clips={document.clips.filter((item) => item.status !== "dismissed")}
        activeId={clip.id}
        frame={player.frame}
        onSeek={player.seek}
        onSelect={onSelect}
      />
      <div className="flex flex-col items-start justify-between gap-space-md rounded-xl bg-surface-container p-space-md shadow-md md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-space-md">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary-fixed">
            <Icon name="sparkles" size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-label-sm font-semibold tracking-wider text-primary-fixed uppercase">
              Active Highlight Preview
            </span>
            <p className="truncate text-headline-md" title={clip.title}>
              Clip #{clip.ordinal}: &quot;{clip.title}&quot;
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1 font-code text-body-sm text-on-surface-variant">
              <span>
                {timecode(clip.inFrame, source.fps)} →{" "}
                {timecode(clip.outFrame, source.fps)}
              </span>
              <span>•</span>
              <span>
                {durationLabel(clip.outFrame - clip.inFrame, source.fps)}s
                duration
              </span>
            </div>
          </div>
        </div>
        <Link
          href={editorHref(clip.id)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-surface-container-high px-3 py-2 text-label-md hover:bg-surface-container-highest"
        >
          <Icon name="sliders" size={18} />
          Manual Trimmer Mode
        </Link>
      </div>
    </section>
  );
}
