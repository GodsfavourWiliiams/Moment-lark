const bars = [
  "h-4 bg-secondary/30",
  "h-7 bg-secondary/50",
  "h-10 bg-secondary",
  "h-5 bg-secondary/40",
  "h-8 bg-secondary/70",
  "h-9 bg-primary-container",
  "h-3 bg-secondary/30",
  "h-7 bg-secondary/60",
  "h-10 bg-primary-container",
  "h-6 bg-secondary/50",
  "h-4 bg-secondary/30",
  "h-8 bg-secondary/70",
  "h-5 bg-secondary/40",
  "h-10 bg-secondary",
  "h-2 bg-secondary/20",
];

/** Decorative sample artwork. No audio has been analyzed. */
export function AudioWaveform() {
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-full items-center justify-between gap-1 overflow-hidden rounded-lg bg-surface-container-lowest p-2"
    >
      {bars.map((bar, index) => (
        <span key={index} className={`w-1.5 shrink-0 rounded-full ${bar}`} />
      ))}
    </div>
  );
}
