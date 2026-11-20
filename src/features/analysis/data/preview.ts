export const ANALYSIS_STAGES = [
  {
    title: "Downloading on-device AI models",
    description:
      "Speech & vision weights verified in browser storage. Local sandbox primed with zero cloud compute requests.",
    result: "Cached (180 MB)",
  },
  {
    title: "Transcribing & analyzing speech",
    description:
      "Identified natural phrase boundaries, question-and-answer pairs, and conversational peaks across 42 minutes.",
    result: "18 Peaks Mapped",
  },
  {
    title: "Scanning visual moments & speaker framing",
    description:
      "Detecting active speaker changes, visual gestures, and framing anchors for 9:16 vertical crop.",
    result: "Framing Mapped",
  },
  {
    title: "Preparing ranked clip suggestions",
    description:
      "Compiling candidate moments with start/end bounds, viral hook scoring, and selection rationale.",
    result: "Suggestions Ready",
  },
] as const;

export const RUNTIME_PREVIEW = [
  { label: "Hardware Backend", value: "Apple Metal / WebGPU" },
  { label: "Active Inference", value: "Whisper + ViT-B/16" },
  { label: "Frame Buffer", value: "2.4 GB / 8.0 GB" },
] as const;
