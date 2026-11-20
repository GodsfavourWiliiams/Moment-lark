import { Icon } from "@/components/ui";

export function PrivacyCard() {
  return (
    <section
      aria-labelledby="privacy-heading"
      className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm"
    >
      <div className="mb-space-md flex items-start gap-space-md">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary-container">
          <Icon name="shield" size={22} />
        </div>
        <div>
          <span className="mb-1 inline-block rounded-sm bg-surface-container-highest px-1.5 py-0.5 font-code text-label-sm text-tertiary-fixed">
            AIR-GAPPED COMPLIANT
          </span>
          <h2
            id="privacy-heading"
            className="text-headline-md font-semibold text-primary"
          >
            100% Client-Side Processing
          </h2>
        </div>
      </div>
      <p className="mb-space-lg text-body-md text-on-surface-variant">
        Your video never leaves your browser. All frame extraction, audio
        transcription, and clipping occurs entirely in your browser thread via
        WebCodecs &amp; IndexedDB.
      </p>
      <div className="flex flex-wrap items-center gap-space-md pt-space-xs text-label-sm text-on-surface-variant">
        {["No Cloud Storage", "Zero Analytics Leaks"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary-container"
            />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
