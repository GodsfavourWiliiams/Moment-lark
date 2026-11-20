export type AspectRatio = "original" | "16:9" | "9:16" | "1:1";
export type ReviewStatus = "unreviewed" | "kept" | "dismissed";
export type SuggestionFilter = "all" | "unreviewed" | "kept";

export type MediaSource = {
  id: string;
  kind: "local";
  name: string;
  url: string | null;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/** Caption times are source-relative frames, so trimming never shifts their meaning. */
export type CaptionCue = {
  id: string;
  text: string;
  start: number;
  end: number;
};
export type ClipDocument = {
  origin?: { kind: "manual" } | { kind: "suggestion"; ordinal: number };
  id: string;
  ordinal: number;
  title: string;
  rationale: string;
  topic: string;
  score: number | null;
  thumbnail: string | null;
  status: ReviewStatus;
  inFrame: number;
  outFrame: number;
  originalIn: number;
  originalOut: number;
  aspect: AspectRatio;
  cropX: number;
  centered: boolean;
  captions: CaptionCue[];
};
export type EditingDocument = { source: MediaSource; clips: ClipDocument[] };
export type EditingState = {
  document: EditingDocument | null;
  reached: {
    suggestions: boolean;
    editor: boolean;
    clips: boolean;
    export: boolean;
  };
  past: EditingDocument[];
  future: EditingDocument[];
  announcement: string;
};
export type ClipPatch = Partial<
  Pick<
    ClipDocument,
    | "title"
    | "inFrame"
    | "outFrame"
    | "aspect"
    | "cropX"
    | "centered"
    | "captions"
  >
>;
export type EditingAction =
  | { type: "reset" }
  | { type: "analysis-complete"; sourceId: string; clips: ClipDocument[] }
  | { type: "enter-editor"; id: string }
  | { type: "prepare-export"; ids: string[] }
  | { type: "append"; clip: ClipDocument }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "load"; document: EditingDocument }
  | { type: "patch"; id: string; patch: ClipPatch }
  | { type: "review"; id: string; status: ReviewStatus }
  | { type: "reset-bounds"; id: string }
  | { type: "undo" }
  | { type: "redo" };
