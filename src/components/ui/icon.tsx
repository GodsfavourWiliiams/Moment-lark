import type { SVGProps } from "react";

const paths = {
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  quote: <path d="M3 5h7v7H6v5H3zm11 0h7v7h-4v5h-3z" />,
  warning: (
    <>
      <path d="m12 3 10 18H2zM12 9v5m0 3h.01" />
    </>
  ),
  zip: (
    <>
      <path d="M3 20V4h7l3 3h8v13zM14 8v2m0 2v2m0 2v2" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none" />,
  pause: <path d="M7 4v16M17 4v16" strokeWidth="5" />,
  backward: (
    <>
      <path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" />
      <path d="M11 9v6m-2-4 2-2" />
    </>
  ),
  forward: (
    <>
      <path d="M20 9a8 8 0 1 0 0 6m0-11v5h-5" />
      <path d="M11 9v6m-2-4 2-2" />
    </>
  ),
  volume: (
    <>
      <path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  muted: <path d="m11 5-6 4H2v6h3l6 4zM16 9l5 6m-5 0 5-6" />,
  aspect: <rect x="2" y="5" width="20" height="14" rx="2" />,
  portrait: <rect x="6" y="2" width="12" height="20" rx="2" />,
  square: <rect x="3" y="3" width="18" height="18" rx="2" />,
  fullscreen: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18m6-18v18M3 9h18M3 15h18" />
    </>
  ),
  sparkles: (
    <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM21 2v4m-2-2h4" />
  ),
  edit: (
    <>
      <path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5" />
    </>
  ),
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  history: (
    <>
      <path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m15 15 6 6M7 10h6m-3-3v6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m15 15 6 6M7 10h6" />
    </>
  ),
  crop: <path d="M6 2v16h16M2 6h16v16" />,
  face: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9h.01M16 9h.01M8 15q4 4 8 0" />
    </>
  ),
  title: <path d="M4 4h16M12 4v16M8 20h8" />,
  captions: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 9H6v6h4m8-6h-4v6h4" />
    </>
  ),
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  video: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h5v5H8zM13 15l3-2v5l-3-2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  spinner: <path d="M21 12a9 9 0 1 1-9-9" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  frame: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7z" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  upload: (
    <>
      <path d="M7 18H5a4 4 0 0 1-1-7.9A7 7 0 0 1 17.5 8H18a5 5 0 0 1 1 9.9h-2" />
      <path d="M12 21V11m-4 4 4-4 4 4" />
    </>
  ),
  folder: (
    <path d="M3 19h16l3-10H7l-4 10V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2" />
  ),
  shield: (
    <>
      <path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h2m4 0h10" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  movie: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 4l3 5m4-5 3 5" />
    </>
  ),
  input: (
    <>
      <path d="M14 4h6v16h-6M3 12h12m-4-4 4 4-4 4" />
    </>
  ),
  share: (
    <>
      <path d="M12 16V3m-4 4 4-4 4 4M7 10H4v11h16V10h-3" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="m8.2 8.2 12.3 12.3M8.2 15.8 20.5 3.5M14 10l-4 4" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
