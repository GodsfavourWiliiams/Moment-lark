import type { SVGProps } from "react";

const paths = {
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
