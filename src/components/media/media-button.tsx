import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export function MediaButton({
  icon,
  label,
  className = "",
  variant = "neutral",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  variant?: "neutral" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-8"} ${variant === "primary" ? "bg-primary-container text-on-primary-fixed shadow-nav hover:bg-surface-tint" : variant === "ghost" ? "bg-transparent text-on-surface-variant hover:bg-surface-container" : "bg-surface-container-high/60 text-on-surface hover:bg-surface-container-highest"} ${className}`}
      {...props}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
