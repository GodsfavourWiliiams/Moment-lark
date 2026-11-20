export const ANALYSIS_STAGES = [
  {
    title: "Downloading on-device AI models",
    description:
      "Verify speech & vision weights in browser storage and prepare the local processing runtime.",
  },
  {
    title: "Transcribing & analyzing speech",
    description:
      "Identify natural phrase boundaries, question-and-answer pairs, and conversational peaks across your recording.",
  },
  {
    title: "Scanning visual moments & speaker framing",
    description:
      "Detect active speaker changes, visual gestures, and framing anchors for optional reframing.",
  },
  {
    title: "Preparing ranked clip suggestions",
    description:
      "Compiling candidate moments with start/end bounds, viral hook scoring, and selection rationale.",
  },
] as const;
