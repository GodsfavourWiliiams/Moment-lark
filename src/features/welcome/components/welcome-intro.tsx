export function WelcomeIntro() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="mx-auto flex max-w-3xl flex-col items-center pt-space-lg text-center"
    >
      <div className="mb-space-md inline-flex flex-wrap items-center justify-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-1 font-code text-label-sm text-on-surface-variant">
        <span
          className="size-2 rounded-full bg-primary-container"
          aria-hidden="true"
        />
        <span>Local Wasm Engine Ready</span>
        <span className="text-outline" aria-hidden="true">
          /
        </span>
        <span className="text-on-surface">Zero Bandwidth</span>
      </div>
      <h1
        id="welcome-heading"
        className="mb-space-sm text-headline-xl font-bold tracking-tight text-primary sm:text-hero"
      >
        Turn raw recordings into clips on your device.
      </h1>
      <p className="max-w-2xl text-body-lg text-balance text-on-surface-variant">
        High-precision browser-based video trimmer. Zero server uploads,
        absolute privacy.
      </p>
    </section>
  );
}
