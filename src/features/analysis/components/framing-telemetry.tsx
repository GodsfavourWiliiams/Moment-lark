import Image from "next/image";
import { Icon } from "@/components/ui";

export function FramingTelemetry() {
  return (
    <aside
      aria-label="Illustrative framing telemetry"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            <Icon name="eye" size={16} className="text-primary-fixed" />
            Live Framing Telemetry
          </h2>
          <span className="font-code text-label-sm text-tertiary-fixed-dim">
            Frame 60,840
          </span>
        </div>
        <figure className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container-highest">
          <Image
            src="/images/analysis-studio.jpg"
            alt="Illustrative frame of two podcast hosts, with sample framing boxes over each speaker."
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 700px, 90vw"
            unoptimized
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"
          />
          <div className="absolute top-[10%] left-[9%] flex h-[72%] w-[34%] flex-col justify-between rounded-md border border-primary-container/80 bg-primary-container/10 p-1 shadow-nav">
            <span className="self-start rounded-sm bg-surface-container-lowest/90 px-1 py-0.5 font-code text-[0.5625rem] font-bold text-primary-fixed">
              SPEAKER_A (Host)
            </span>
            <span className="self-end rounded-sm bg-surface-container-lowest/90 px-1 py-0.5 font-code text-[0.5625rem] text-tertiary-fixed">
              9:16 Lock
            </span>
          </div>
          <div className="absolute top-[13%] right-[9%] flex h-[64%] w-[29%] flex-col justify-between rounded-md border border-secondary/60 bg-secondary-container/20 p-1">
            <span className="self-start rounded-sm bg-surface-container-lowest/90 px-1 py-0.5 font-code text-[0.5625rem] text-secondary-fixed">
              SPEAKER_B
            </span>
            <span className="self-end rounded-sm bg-surface-container-lowest/90 px-1 py-0.5 font-code text-[0.5625rem] text-on-surface-variant">
              Ambient
            </span>
          </div>
          <figcaption className="absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-between gap-1 rounded-sm bg-surface-container-lowest/85 px-2 py-1 font-code text-[0.625rem] text-on-surface backdrop-blur-md">
            <span>Crop: Smart Center Track</span>
            <span className="text-primary-fixed">Aspect: 1080 × 1920</span>
          </figcaption>
        </figure>
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between gap-2 text-label-sm">
            <span className="text-on-surface-variant">
              Speech Cadence Detection
            </span>
            <span className="font-code text-on-surface">142 WPM</span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
          >
            <div className="h-full w-3/4 bg-secondary" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-label-sm">
            <span className="text-on-surface-variant">
              Emotional Inflection Index
            </span>
            <span className="font-code text-on-surface">High (0.88)</span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
          >
            <div className="h-full w-[88%] bg-tertiary-fixed-dim" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl bg-surface-container-lowest/80 p-4">
        <Icon name="shield" className="mt-0.5 shrink-0 text-primary-fixed" />
        <p className="text-body-sm leading-relaxed text-on-surface-variant">
          <strong className="text-on-surface">Zero cloud upload.</strong>{" "}
          Processing runs entirely on this device using local WebGPU
          acceleration. No audio or video data ever leaves your computer.
        </p>
      </div>
    </aside>
  );
}
