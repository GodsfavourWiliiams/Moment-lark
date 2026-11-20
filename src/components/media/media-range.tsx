export function MediaRange({
  label,
  value,
  max,
  step = 1,
  onChange,
  className = "",
  stereo = false,
}: {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  stereo?: boolean;
}) {
  return (
    <div
      className={`relative flex h-5 items-center rounded focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-container ${className}`}
    >
      <div aria-hidden="true" className="flex w-full flex-col gap-1">
        {Array.from({ length: stereo ? 2 : 1 }, (_, i) => (
          <div
            key={i}
            className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest"
          >
            <div
              className="h-full rounded-full bg-primary-fixed"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
