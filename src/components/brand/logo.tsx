import Image from "next/image";
import { BRAND } from "@/config/brand";

type LogoProps = { variant?: "mark" | "text" | "both"; className?: string };

/** Locally hosted brand mark, reconstructed from the supplied visual reference. */
export function Logo({ variant = "both", className = "" }: LogoProps) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-3 ${className}`}>
      {variant !== "text" && (
        <Image
          src={BRAND.markSrc}
          width={28}
          height={28}
          alt={variant === "mark" ? BRAND.name : ""}
          className="size-7 shrink-0 object-contain"
          unoptimized
        />
      )}
      {variant !== "mark" && (
        <span className="text-headline-md font-bold tracking-tight text-primary transition-colors group-hover:text-primary-fixed motion-reduce:transition-none">
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
