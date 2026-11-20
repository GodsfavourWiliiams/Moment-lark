"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { WorkspacePane } from "@/components/layout/workspace-panel";
import { VideoPreview } from "@/components/media/video-preview";
import { MediaSettings } from "@/components/media/media-settings";
import { useEditing } from "@/hooks/use-editing";
import { useClipPlayer } from "@/hooks/use-clip-player";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { editorHref, getStudioSection } from "@/config/navigation";
import type { ClipDocument, ClipPatch } from "@/types/editing";
import { EditorContextBar } from "./components/editor-context-bar";
import { TrimTimeline } from "./components/trim-timeline";
import { FramingPanel } from "./components/framing-panel";
import { CaptionsPanel } from "./components/captions-panel";
import { EditorActions } from "./components/editor-actions";

export function EditorPage() {
  const { document } = useEditing();
  const params = useSearchParams();
  const id = params.get("clip") ?? "2";
  const clip =
    document.clips.find((clip) => clip.id === id) ?? document.clips[0];
  return (
    <EditorWorkspace key={`${document.source.id}:${clip.id}`} clip={clip} />
  );
}

function EditorWorkspace({ clip }: { clip: ClipDocument }) {
  const editing = useEditing();
  const router = useRouter();
  const source = editing.document.source;
  const clips = editing.document.clips;
  const player = useClipPlayer(
    Math.min(clip.outFrame - 1, clip.inFrame + Math.round(27.3 * source.fps)),
    source.durationInFrames,
  );
  const [settings, setSettings] = useState(false);
  const patch = (patch: ClipPatch) =>
    editing.dispatch({ type: "patch", id: clip.id, patch });
  const keep = () =>
    editing.dispatch({ type: "review", id: clip.id, status: "kept" });
  const next = clips
    .slice(clips.findIndex((item) => item.id === clip.id) + 1)
    .find((item) => item.status !== "dismissed");
  const discard = () => {
    editing.dispatch({ type: "review", id: clip.id, status: "dismissed" });
    router.push(
      next ? editorHref(next.id) : getStudioSection("suggestions").href,
    );
  };
  useEditorShortcuts({
    player,
    clip,
    source,
    patch,
    keep,
    undo: () => editing.dispatch({ type: "undo" }),
    redo: () => editing.dispatch({ type: "redo" }),
  });
  return (
    <div
      data-editor-workspace
      tabIndex={0}
      aria-label="Video editor workspace"
      className="flex w-full flex-col xl:h-[calc(100dvh-4rem-1px)] xl:overflow-hidden"
    >
      <EditorContextBar
        clip={clip}
        clips={clips}
        onSettings={() => setSettings(true)}
      />
      <div className="grid min-h-[calc(100dvh-7.5rem)] grid-cols-1 items-start gap-space-md bg-surface p-space-md xl:min-h-0 xl:flex-1 xl:grid-cols-12 xl:items-stretch xl:overflow-hidden">
        <WorkspacePane
          aria-label="Video preview and timeline"
          className="xl:col-span-7 2xl:col-span-8"
        >
          <VideoPreview
            source={source}
            clip={clip}
            player={player}
            editor
            onSettings={() => setSettings(true)}
            onAspect={() => {}}
          />
          <section
            aria-label="Moment rationale"
            className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md md:flex-row md:items-center"
          >
            <div className="flex min-w-0 items-start gap-2">
              <span className="shrink-0 rounded-lg bg-surface-container-highest p-2 text-primary-fixed">
                <Icon name="sparkles" size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                  <h2 className="text-label-sm font-bold tracking-wider text-primary-fixed uppercase">
                    {source.kind === "demo"
                      ? "AI Moment Rationale"
                      : "Clip Rationale"}
                  </h2>
                  <span className="rounded bg-surface-container px-1.5 text-label-sm text-on-surface-variant">
                    {source.kind === "demo"
                      ? "High Attention Hook"
                      : "Manual Selection"}
                  </span>
                </div>
                <p className="text-body-md">{clip.rationale}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                editing.dispatch({ type: "reset-bounds", id: clip.id })
              }
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-label-md shadow-sm hover:bg-surface-container-high"
            >
              <Icon name="history" size={16} className="text-primary-fixed" />
              Reset to original{" "}
              {source.kind === "demo" ? "AI suggestion" : "clip"} bounds
            </button>
          </section>
          <TrimTimeline
            clip={clip}
            source={source}
            frame={player.frame}
            onSeek={player.seek}
            onPatch={patch}
          />
          <div className="flex items-center gap-4 px-1 text-body-sm text-on-surface-variant">
            <button
              type="button"
              disabled={!editing.past.length}
              onClick={() => editing.dispatch({ type: "undo" })}
              className="hover:text-on-surface disabled:opacity-30"
            >
              Undo ⌘Z
            </button>
            <button
              type="button"
              disabled={!editing.future.length}
              onClick={() => editing.dispatch({ type: "redo" })}
              className="hover:text-on-surface disabled:opacity-30"
            >
              Redo ⇧⌘Z
            </button>
            <span className="ml-auto">
              {source.kind === "demo"
                ? "Design sample · example analysis"
                : "Local editing · session only"}
            </span>
          </div>
        </WorkspacePane>
        <WorkspacePane
          aria-label="Clip settings"
          className="xl:col-span-5 2xl:col-span-4"
        >
          <FramingPanel clip={clip} onPatch={patch} />
          <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-md">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="hook-title"
                className="flex items-center gap-1.5 text-label-md font-semibold"
              >
                <Icon name="title" size={18} className="text-primary-fixed" />
                Dynamic Hook / Title Overlay
              </label>
              <span className="shrink-0 font-code text-label-sm text-primary-fixed">
                {clip.title.length} / 60 chars
              </span>
            </div>
            <input
              id="hook-title"
              type="text"
              maxLength={60}
              value={clip.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Enter headline punchline…"
              className="w-full rounded-lg bg-surface-container-lowest px-3 py-2.5 text-headline-md font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
            <p className="text-body-sm text-on-surface-variant">
              Rendered as styled animated typography in the top-third frame for
              the first 3 seconds.
            </p>
          </section>
          <CaptionsPanel source={source} clip={clip} onPatch={patch} />
          <EditorActions
            clip={clip}
            keptCount={clips.filter((item) => item.status === "kept").length}
            next={next}
            onKeep={keep}
            onDiscard={discard}
            onQueue={() => router.push(getStudioSection("clips").href)}
          />
        </WorkspacePane>
      </div>
      <p role="status" className="sr-only">
        {editing.announcement}
      </p>
      <MediaSettings
        open={settings}
        onClose={() => setSettings(false)}
        clip={clip}
      />
    </div>
  );
}
