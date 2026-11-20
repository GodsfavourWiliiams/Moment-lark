import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-primary-container text-on-primary-fixed shadow-neon hover:bg-surface-tint active:scale-[0.98]",
  secondary:
    "bg-surface-container text-primary hover:bg-surface-container-highest hover:text-primary-container",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-control items-center justify-center gap-space-sm rounded-lg px-space-lg py-2.5 text-label-md font-semibold transition duration-200 motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      onClick={(event) => {
        // Safari does not focus pointer-activated buttons by default. Keep dialog return focus reliable.
        event.currentTarget.focus({ preventScroll: true });
        onClick?.(event);
      }}
      {...props}
    />
  );
}
