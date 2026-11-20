import { EDITING_DEMO } from "../config/editing-demo";
import { clamp } from "../lib/timecode";
import type {
  ClipDocument,
  EditingAction,
  EditingDocument,
  EditingState,
} from "../types/editing";

export const initialEditingState: EditingState = {
  document: EDITING_DEMO,
  past: [],
  future: [],
  announcement: "",
};
export function editingReducer(
  state: EditingState,
  action: EditingAction,
): EditingState {
  if (action.type === "load")
    return {
      document: action.document,
      past: [],
      future: [],
      announcement: "Video loaded. Ready to edit.",
    };
  if (action.type === "undo") {
    const document = state.past.at(-1);
    return document
      ? {
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
          document,
          past: [...state.past, state.document],
          future: state.future.slice(1),
          announcement: "Change restored.",
        }
      : state;
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
    document,
    past: [...state.past.slice(-49), state.document],
    future: [],
    announcement,
  };
}
