import { clamp } from "../lib/timecode";
import type {
  ClipDocument,
  EditingAction,
  EditingDocument,
  EditingState,
} from "../types/editing";

export const initialEditingState: EditingState = {
  document: null,
  reached: { suggestions: false, editor: false, clips: false, export: false },
  past: [],
  future: [],
  announcement: "",
};
export function editingReducer(
  state: EditingState,
  action: EditingAction,
): EditingState {
  if (action.type === "reset") return initialEditingState;
  if (action.type === "load")
    return {
      document: action.document,
      reached: { ...initialEditingState.reached },
      past: [],
      future: [],
      announcement: "Video loaded. Awaiting analysis.",
    };
  if (!state.document) return state;
  if (action.type === "analysis-complete") {
    if (
      action.sourceId !== state.document.source.id ||
      state.reached.suggestions
    )
      return state;
    return {
      ...state,
      document: {
        ...state.document,
        analysis: action.analysis,
        clips: action.clips.map((clip) => ({
          ...clip,
          status: "unreviewed",
          aspect: "original",
          origin: { kind: "suggestion", ordinal: clip.ordinal },
        })),
      },
      reached: { ...state.reached, suggestions: true },
      announcement: `${action.clips.length} suggestions ready for review.`,
    };
  }
  if (action.type === "enter-editor") {
    if (
      !state.reached.suggestions ||
      !state.document.clips.some((clip) => clip.id === action.id)
    )
      return state;
    return { ...state, reached: { ...state.reached, editor: true } };
  }
  if (action.type === "prepare-export") {
    if (
      !action.ids.length ||
      !action.ids.every((id) =>
        state.document!.clips.some(
          (clip) => clip.id === id && clip.status === "kept",
        ),
      )
    )
      return state;
    return { ...state, reached: { ...state.reached, export: true } };
  }
  if (action.type === "undo") {
    const document = state.past.at(-1);
    return document
      ? {
          ...state,
          document,
          past: state.past.slice(0, -1),
          future: [state.document, ...state.future],
          announcement: "Change undone.",
        }
      : state;
  }
  if (action.type === "redo") {
    const document = state.future[0];
    return document
      ? {
          ...state,
          document,
          past: [...state.past, state.document],
          future: state.future.slice(1),
          announcement: "Change restored.",
        }
      : state;
  }
  if (!state.reached.suggestions) return state;
  if (action.type === "append" || action.type === "duplicate") {
    const original =
      action.type === "duplicate"
        ? state.document.clips.find((clip) => clip.id === action.id)
        : null;
    const clip =
      action.type === "append"
        ? action.clip
        : original
          ? {
              ...structuredClone(original),
              id: action.newId,
              ordinal:
                Math.max(
                  0,
                  ...state.document.clips.map((item) => item.ordinal),
                ) + 1,
              title: `${original.title.slice(0, 53)} (copy)`,
              status: "kept" as const,
              origin: original.origin ?? {
                kind: "suggestion" as const,
                ordinal: original.ordinal,
              },
            }
          : null;
    if (!clip || state.document.clips.some((item) => item.id === clip.id))
      return state;
    return {
      ...state,
      reached: {
        ...state.reached,
        editor: state.reached.editor || action.type === "append",
        clips: state.reached.clips || clip.status === "kept",
      },
      document: { ...state.document, clips: [...state.document.clips, clip] },
      past: [...state.past.slice(-49), state.document],
      future: [],
      announcement:
        action.type === "duplicate"
          ? "Clip duplicated. Edits are independent."
          : "Manual clip created.",
    };
  }
  const existing = state.document.clips.find((clip) => clip.id === action.id);
  if (!existing) return state;
  let updated: ClipDocument;
  let announcement = state.announcement;
  if (action.type === "review") {
    if (existing.status === action.status) return state;
    updated = { ...existing, status: action.status };
    announcement = `Clip ${existing.ordinal} ${action.status === "kept" ? "added to the kept queue" : action.status === "dismissed" ? "dismissed. Undo is available" : "returned to review"}.`;
  } else if (action.type === "reset-bounds") {
    updated = {
      ...existing,
      inFrame: existing.originalIn,
      outFrame: existing.originalOut,
    };
    announcement = "Original clip boundaries restored.";
  } else {
    updated = { ...existing, ...action.patch };
    updated.title = updated.title.slice(0, 60);
    updated.inFrame = clamp(
      Math.round(updated.inFrame),
      0,
      state.document.source.durationInFrames - 1,
    );
    updated.outFrame = clamp(
      Math.round(updated.outFrame),
      updated.inFrame + 1,
      state.document.source.durationInFrames,
    );
    // Moving only the in-handle must not push the out-handle.
    if (
      action.patch.inFrame !== undefined &&
      action.patch.outFrame === undefined
    )
      updated.inFrame = Math.min(updated.inFrame, existing.outFrame - 1);
    updated.outFrame =
      action.patch.outFrame === undefined
        ? existing.outFrame
        : updated.outFrame;
    updated.cropX = clamp(updated.cropX, 0, 1);
    if (JSON.stringify(updated) === JSON.stringify(existing)) return state;
  }
  const document: EditingDocument = {
    ...state.document,
    clips: state.document.clips.map((clip) =>
      clip.id === updated.id ? updated : clip,
    ),
  };
  return {
    ...state,
    reached: {
      ...state.reached,
      clips: state.reached.clips || updated.status === "kept",
    },
    document,
    past: [...state.past.slice(-49), state.document],
    future: [],
    announcement,
  };
}
