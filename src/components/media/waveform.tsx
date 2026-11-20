export function Waveform({
  className = "",
  peaks,
  variant = "clip",
}: {
  className?: string;
  peaks?: number[];
  variant?: "source" | "clip";
}) {
  if (!peaks?.length)
    return (
      <svg
        aria-hidden="true"
        viewBox={variant === "source" ? "0 0 400 30" : "0 0 400 60"}
        preserveAspectRatio="none"
        className={`h-full w-full ${className}`}
      >
        {variant === "source" ? (
          <path
            d="M0 15 L5 15 L7 8 L10 22 L14 10 L18 20 L22 6 L26 24 L30 15 L35 15 L38 4 L42 26 L46 9 L50 21 L55 15 L60 15 L63 2 L67 28 L71 7 L75 23 L80 15 L85 15 L90 10 L94 20 L98 12 L102 18 L108 15 L114 6 L118 24 L122 15 L128 15 L132 8 L136 22 L140 15 L145 15 L150 4 L154 26 L158 9 L162 21 L168 15 L175 15 L180 11 L184 19 L188 15 L195 15 L200 7 L204 23 L208 15 L215 15 L220 5 L224 25 L228 15 L235 15 L240 10 L244 20 L248 15 L255 15 L260 6 L264 24 L268 15 L275 15 L280 8 L284 22 L288 15 L295 15 L300 4 L304 26 L308 15 L315 15 L320 9 L324 21 L328 15 L335 15 L340 7 L344 23 L348 15 L355 15 L360 11 L364 19 L368 15 L375 15 L380 5 L384 25 L388 15 L395 15 L400 15"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        ) : (
          <g fill="currentColor">
            <path
              d="M0,30 Q10,10 20,30 T40,45 T60,15 T80,30 T100,8 T120,35 T140,20 T160,30 T180,5 T200,40 T220,12 T240,30 T260,18 T280,38 T300,10 T320,30 T340,15 T360,42 T380,22 T400,30 L400,30 L0,30 Z"
              opacity="0.35"
            />
            <path
              d="M0,30 Q10,18 20,30 T40,38 T60,22 T80,30 T100,14 T120,32 T140,25 T160,30 T180,10 T200,34 T220,18 T240,30 T260,22 T280,32 T300,16 T320,30 T340,20 T360,36 T380,26 T400,30 L400,30 L0,30 Z"
              opacity="0.85"
            />
          </g>
        )}
      </svg>
    );
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
