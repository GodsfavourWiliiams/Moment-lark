export const ANALYSIS_STAGES = [
  {
    title: "Loading on-device AI models",
    description:
      "Load the speech model on this device. Sound and clip-selection models load when needed; the browser caches downloads.",
  },
  {
    title: "Transcribing & analyzing speech",
    description:
      "Identify natural phrase boundaries, question-and-answer pairs, and conversational peaks across your recording.",
  },
  {
    title: "Detecting sound events",
    description:
      "Listen for laughter, cheering, applause, and other audio events. The original video frame stays unchanged.",
  },
  {
    title: "Preparing ranked clip suggestions",
    description:
      "Select complete moments from speech and sound evidence, with validated clip boundaries and an explanation.",
  },
] as const;
