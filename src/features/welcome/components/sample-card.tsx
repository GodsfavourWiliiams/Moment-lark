import { Button, Icon } from "@/components/ui";
import { DEMO_VIDEO } from "@/config/demo";
import { AudioWaveform } from "./audio-waveform";

export function SampleCard({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <section
      aria-labelledby="sample-heading"
      className="flex min-w-0 flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm"
    >
      <div>
        <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-xs">
          <span className="rounded-sm bg-surface-container-highest px-2 py-0.5 font-code text-label-sm text-primary-container">
            PRE-LOADED DEMO
          </span>
          <span className="font-code text-label-sm text-on-surface-variant">
            42:15 • 1080p60
          </span>
        </div>
        <h2
          id="sample-heading"
          className="mb-space-xs flex items-center gap-space-xs text-headline-md font-semibold text-primary"
        >
          <Icon name="movie" className="shrink-0 text-primary-container" />
          <span className="truncate" title={DEMO_VIDEO.name}>
            {DEMO_VIDEO.name}
          </span>
        </h2>
        <p className="mb-space-md text-body-md text-on-surface-variant">
          Test multi-track waveform generation, silence trimming, and vertical
          format conversions instantly without finding a local file.
        </p>
        <AudioWaveform />
      </div>
      <div className="pt-space-md">
        <Button
          id="analyze-sample-button"
          onClick={onAnalyze}
          className="group w-full"
        >
          <span>Analyze Sample Video</span>
          <Icon
            name="arrow"
            size={18}
            className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Button>
      </div>
    </section>
  );
}
