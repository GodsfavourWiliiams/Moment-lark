# Moment Lark

Moment Lark is a browser video clipping workspace built from the supplied Stitch designs with Next.js, TypeScript, and Tailwind CSS v4.

The workflow is **Import → Analysis → Suggestions → optional Editor → Clips → Export**. All screens share the root layout and normal Next.js navigation links. A fresh session contains no recording or clips. Import opens the in-place Analysis state, never the Editor. Header links and direct routes use the same session prerequisites: Suggestions requires completed analysis results for the active source, Analysis automatically routes to Suggestions when results are ready; Editor requires an explicit edit action, Clips requires a kept clip, and Export requires proceeding with selected kept clips. Reached steps remain available for revisiting and undo; importing another video resets them.

The media foundation uses **Remotion Player**, **@remotion/media**, and **@remotion/web-renderer**. The UI retains the supplied layout and controls; Remotion handles composition playback and rendering. One composition drives preview and export. Mediabunny reads local metadata and samples bounded audio windows for the timeline.

Local file import reads metadata and starts with an empty clip list. Playback, frame-grid trim controls, original source framing by default, optional 9:16 / 1:1 crops, manual horizontal crop positioning, title overlays, timed captions, undo/redo, keep/dismiss, and a kept-clip queue are implemented. The Clips route supports format filters, sorting, per-clip export selection, preview, duplication, removal with undo, and creating manual clips. Export snapshots clip settings, processes selected clips sequentially, and retains progress and completed files across route navigation. Failed/canceled jobs can be retried; completed MP4s can be previewed, downloaded individually, or bundled into a ZIP with fflate. Editing a clip invalidates its previous render in the export UI.

Local transcription, required sound-event detection and AI highlight ranking are implemented with pinned browser models. The import preflight checks saved model files without starting downloads, explains missing downloads and short-video limits, and successful analysis automatically opens Suggestions. Sound analysis adds a second audio scan; it improves event coverage, not processing speed. Active-speaker tracking and persistent project storage remain future work. See [the analysis guide](docs/mvp-plan.md) for measured limits and the prompt registry.

The analysis form initializes saved Whisper weights on mount in a worker with remote model downloads disabled. Once the speech model and guest access are ready, analysis starts automatically with that same worker, without a setup confirmation. Missing speech files still require download consent. On an automatic start, uncached AudioSet or Qwen files pause analysis at their respective stages for download approval; cancelling refunds the reserved slot. Preparation itself does not transcribe the video or reserve a guest slot. Cancellation terminates the worker without deleting cached files. Small setup/runtime files may still load while preparing cached weights. Failed analyses require an explicit retry rather than automatically looping.

To reuse models across browsers, open **Import or export saved AI models** on the Import screen (or `/models`) at the site address where the original browser saved them. Export a `.mlmodels` pack, then import it in the other browser. This transfers compatible cached model files only, without video data or guest usage. An incomplete pack is allowed; analysis downloads remaining files after consent. A website cannot discover another browser's storage or models installed by desktop apps. Browsers may evict saved files, so keep the exported pack if you want a reusable backup.

Model packs validate pinned versions, allowed resource URLs, sizes and SHA-256 checksums before writing to browser caches. Cancellation during copying can leave valid files already copied. Export streams to a file where a save-file picker is supported; other browsers assemble the pack in memory. A full pack is about 1.2 GB. Speech and sound model JSON metadata ships under `public/models` to avoid cross-origin metadata requests; large model weights still load from their pinned upstream URLs. After changing those pins, refresh metadata with `node --import tsx scripts/download-model-metadata.mts` and review the downloaded files.

## Run locally

```bash
npm ci
npm run dev
```

In a second terminal, start the guest API (this applies the local database migrations first):

```bash
npm run dev:api
```

Open <http://localhost:3000>. The frontend uses port 3000 and forwards `/api/*` to the local Worker on port 8787. Keep both processes running. Use `localhost:3000`, matching `APP_ORIGIN` in `wrangler.local.jsonc`; if you deliberately use a different frontend origin, update that setting. CI uses Node.js 24; use Node.js 24 for the full frontend/backend toolchain.

### Guest session slice

The welcome screen reads a D1-backed guest allowance of **three source videos**, configured as `GUEST_ALLOWANCE_VIDEOS: "3"` in `wrangler.local.jsonc`. There is no scheduled allowance reset in local testing. Session expiry or clearing cookies can still produce a new guest; production identity/abuse controls remain pending.

Each local source file may be up to **2 GB (2,000,000,000 bytes)**. `src/lib/media/source-limits.ts` checks size before opening analysis and again before media inspection. The former 90-minute cap is removed; duration must still be readable and positive. File size does not guarantee processing performance on every device, and long-recording AI benchmarks remain pending.

Migration `0003` converts the unused local minute ledger into a three-video ledger while preserving guest IDs and cookies. It refuses conversion if unexpected minute usage/reservations exist, because minutes cannot be translated reliably into video counts. The earlier migrations remain in place for existing local databases. Reservations and successful-analysis accounting are the next slice; imports do not consume slots yet. Multiple clips, editing and exports from an already analyzed source should not consume additional slots.

- `GET /api/health`: API availability.
- `POST /api/guest/session`: create a guest or reuse the valid session cookie. Accepts only an empty JSON object and requires the configured app Origin.
- `GET /api/guest/usage`: return that session's allowance, or `401` when the session is missing/expired.

The session cookie lasts seven days and is host-only, HttpOnly, and SameSite=Strict. The token is generated randomly; only its SHA-256 digest is stored in D1. HTTPS responses set Secure; the explicit local HTTP setup cannot use a Secure cookie. Deployed guest issuance is disabled until the production cookie policy, separate D1 bindings, issuance/network limits, and Turnstile checks are implemented. The public deployment can serve the API health endpoint but returns `503 guest_unavailable` for guest endpoints. No production database or cloud resource has been provisioned.

The local database persists under ignored `.wrangler/state/`; ordinary page reloads and API restarts keep the guest balance. Tests use a separate ephemeral D1 instance. Clearing cookies or using another browser creates a different local test guest. Reservations, spending/refunds, Turnstile-protected public sessions and network counters are implemented. Production and deployed dev require their own D1 bindings, migrated schema and secrets. No media or transcript is sent by these endpoints. Import pauses at the analysis preflight; validated analysis results unlock Suggestions.

Run `npm run test:api` for database/API tests, or `npm test` for the full suite. The local runtime needs permission to open loopback ports. See [the backend learning guide](docs/backend-plan.md#first-working-slice-local-guest-sessions) for the request path and where to read the code.

## Cloudflare Workers deployment

This application uses Next.js `output: "export"`. The root `wrangler.jsonc` serves `out/` as Workers Static Assets and runs `server/index.ts` for `/api/*`; no OpenNext server adapter is needed. `wrangler.local.jsonc` is exclusively for local backend development and must not be used as a deployment configuration.

Set the Git-connected Worker build settings to:

- Production branch: `master`
- Root directory: repository root
- Build command: `pnpm run build`
- Production deploy command: `npx wrangler deploy --config wrangler.jsonc`
- Non-production branch deploy command: `pnpm run deploy:preview` (uses the Git branch name)

After building, `npm run check:deploy` bundles the Worker and validates assets without publishing. Public guest endpoints require the configured secrets and remote migrations. The production and stable dev URLs have separate database bindings. Never attach a production database to branch previews. Follow the [deployment and SQL walkthrough](docs/deployment.md) before running remote commands.

Use one Git-connected Worker, `moment-lark`, with the `dev` branch preview beneath it. `deploy:dev` explicitly updates that preview; `deploy:preview` uses the current Git branch. Neither creates a standalone `dev-moment-lark` Worker. The `previews` block binds the dev database and configures the exact dev preview origin; other branch previews do not gain public guest access automatically. See the deployment guide for retiring the former duplicate Worker.

The Wrangler configuration must be included in the branch being deployed. It explicitly selects `out/`, serves exported HTML routes such as `/editor` from `editor.html`, and uses the exported `404.html` for unknown paths. Keep `output: "export"` in `next.config.ts`.

Without a Wrangler configuration, automatic Next.js detection can install OpenNext during deployment. OpenNext expects server output under `.next/standalone`, which a static export does not produce, leading to the missing `pages-manifest.json` error. Deploying the static assets avoids that incompatible migration and second build.

References: [Cloudflare static site configuration](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/) and [Wrangler automatic configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/).

## Structure

```text
src/
  app/                 Thin Next.js routes, root layout, global base styles
  components/
    ui/                Shared button, dialog, icon, keyboard hint
    brand/             Logo with mark, text, and both variants
    layout/            Shared studio header and dialogs
    media/             Shared Remotion composition, player, controls, queue
    providers/         Studio workflow and shared editing document
  config/              Brand, navigation routes, shortcuts
  features/welcome/    Import screen components and display data
  features/analysis/   In-place import/analysis state and stage components
  features/suggestions/ Ranked cards, filters, source timeline, decision bar
  features/editor/     Clip editing panels and precision timeline
  features/clips/      Kept-clip cards, filters, sorting, batch selection
  features/export/     Render progress, recovery, downloads
  hooks/               UI behavior and keyboard shortcuts
  state/               Per-feature reducers and contexts (studio, editing, export)
  lib/                 Timecode, crop geometry, local media input/export
  types/               Shared UI/domain types
  styles/tokens.css    Tailwind theme tokens from Stitch
```

`src/services/` contains frontend endpoint/API clients. Browser media helpers and pure utilities belong in `lib/`; hooks manage lifecycle and UI behavior. No per-feature service folders are introduced.

The backend lives in `server/`: Hono routes, session business logic, parameterized database repositories, and versioned SQL migrations under `server/db/migrations/`. `shared/contracts/` contains Zod request/response schemas used by both sides. Frontend state/types remain in `src/state/` and `src/types/`. Backend code uses a separate TypeScript configuration and is excluded from the frontend typecheck.

## Styling and accessibility

Use Tailwind utilities in components. `src/styles/tokens.css` defines the semantic palette, typography, spacing, radii, and shadows with Tailwind's `@theme`. For example: `bg-surface-container-low`, `text-headline-md`, `gap-space-lg`, and `shadow-neon`. Global CSS contains only the font declaration and shared base styles; there are no component CSS files.

The root layout owns the header, main landmark, provider, and dialogs. `src/config/navigation.ts` is the single source for workflow labels and routes. Workflow routes become available only when their step has been reached. The header stays in the shared layout; analysis remains a state of Import.

Inter is hosted locally in `public/fonts/`. `Logo` accepts `variant="mark"`, `variant="text"`, or `variant="both"` (default). The brand mark is a local SVG reconstructed from the supplied visual reference: a dark rounded tile with lime bars and rings joined by a white diagonal connector. Its path is configured in `src/config/brand.ts`; the favicon uses the same artwork. SVG icons do not depend on an external icon font.

The UI includes semantic landmarks/headings, a skip link, keyboard-operable controls, focus outlines, reduced-motion variants, announced file-selection/error states, and native dialogs with Escape handling, focus containment, and focus restoration. Single-letter O opens the picker only while the import section has focus. Cmd/Ctrl+K opens shortcut help. Editor single-letter shortcuts are scoped to the focused workspace and do not intercept text inputs, buttons, links, sliders, or open dialogs. Trim handles support pointer capture and keyboard adjustments, with editable timecodes as an alternative.

## Media constraints

Codec decoding and H.264/AAC encoding depend on browser capabilities; unsupported files and export configurations produce errors rather than silent success. MOV is a container, not a promise that every ProRes variant will decode. The timeline uses a normalized frame grid derived from the source; variable-frame-rate recordings are not guaranteed source-frame-exact cuts. Exports re-encode rather than performing lossless bitstream copying.

Original framing preserves source dimensions on export and fits the full source into the preview without cropping. Geometry tests cover landscape, portrait, square, and 4:3 sources, including preview/export crop alignment. Rotated-file metadata still needs a broader real-media test matrix. Long-file memory, cancellation, codec coverage, and browser compatibility also require a broader media test matrix.

Remotion's [license terms](https://www.remotion.dev/license) apply. Where required, configure `NEXT_PUBLIC_REMOTION_LICENSE_KEY` at build time; this is a browser-visible license key, not a private API credential. The web renderer reports usage/licensing metadata to Remotion. Media processing stays local, but the application must not be described as fully air-gapped or telemetry-free.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

A local 10-second MP4 was loaded through an isolated verification fixture, trimmed from 1–3 seconds, cropped to 9:16, and exported through the actual queue UI in Safari. The downloaded output contained 60 AVC frames at 30 fps, 1080×1920 video and AAC audio; a decoded frame confirmed the title and timed caption. The temporary fixture was removed afterward. Native file-picker confirmation could not be verified in the automated Safari session.

The new Export route was also verified with two three-second local clips: queued cancellation, retry, completion across route navigation, rendered preview, and a ZIP download. The downloaded archive passed integrity checks and contained two 1920×1080 AVC/AAC MP4s, each with 90 video frames at 30 fps (3.008 seconds including AAC padding). The temporary test route and media were removed afterward.

Queue checks cover duplication/undo, filtering/sorting, original-frame manual clips, stale-render detection, completion totals, and ZIP file integrity. Export statistics come from actual jobs; demo images cannot report successful renders or fabricated memory errors. ZIP assembly retains file data in memory and should be assessed for very large batches.

The production build produces `out/` for static hosting. CI runs these checks on pushes to `dev`/`master` and pull requests into `master`.

## Branches

- `master`: reviewed changes
- `dev`: integration branch for active work

Work starts on `dev` and reaches `master` through a pull request.

Workflow tests cover empty sessions, importing without bypassing Analysis, stale analysis results, optional editing, keep/export prerequisites, and resetting access on source replacement. The fresh-session Editor redirect was also checked in Safari. The native file picker remained unable to confirm the test file during this check; a complete import-through-analysis browser check is still outstanding.
