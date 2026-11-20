export function Waveform({
  className = "",
  peaks,
}: {
  className?: string;
  peaks?: number[];
  variant?: "source" | "clip";
}) {
  if (!peaks?.length)
    return <div aria-hidden="true" className={`h-full w-full ${className}`} />;
  const values = peaks.map((p) => Math.max(1, p * 30));
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${values.length * 5} 64`}
      preserveAspectRatio="none"
      className={`h-full w-full ${className}`}
      fill="currentColor"
    >
      {values.map((height, i) => (
        <rect
          key={i}
          x={i * 5}
          y={32 - height}
          width={2.5}
          height={height * 2}
          rx={1}
        />
      ))}
    </svg>
  );
}
