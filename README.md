# Moment Lark

Moment Lark is a browser video clipping workspace built from the supplied Stitch designs with Next.js, TypeScript, and Tailwind CSS v4.

The workflow is **Import → Analysis → Suggestions → optional Editor → Clips → Export**. All screens share the root layout and normal Next.js navigation links. A fresh session contains no recording or clips. Import opens the in-place Analysis state, never the Editor. Header links and direct routes use the same session prerequisites: Suggestions requires completed analysis results for the active source, Analysis automatically routes to Suggestions when results are ready; Editor requires an explicit edit action, Clips requires a kept clip, and Export requires proceeding with selected kept clips. Reached steps remain available for revisiting and undo; importing another video resets them.

The media foundation uses **Remotion Player**, **@remotion/media**, and **@remotion/web-renderer**. The UI retains the supplied layout and controls; Remotion handles composition playback and rendering. One composition drives preview and export. Mediabunny reads local metadata and samples bounded audio windows for the timeline.

Local file import reads metadata and starts with an empty clip list. Playback, frame-grid trim controls, original source framing by default, optional 9:16 / 1:1 crops, manual horizontal crop positioning, title overlays, timed captions, undo/redo, keep/dismiss, and a kept-clip queue are implemented. The Clips route supports format filters, sorting, per-clip export selection, preview, duplication, removal with undo, and creating manual clips. Export snapshots clip settings, processes selected clips sequentially, and retains progress and completed files across route navigation. Failed/canceled jobs can be retried; completed MP4s can be previewed, downloaded individually, or bundled into a ZIP with fflate. Editing a clip invalidates its previous render in the export UI.

Automatic transcription, AI highlight ranking, active-speaker tracking, and persistent project storage remain future work. The simulated analysis timer, example suggestions, stock media, and fabricated telemetry have been removed from production. The Analysis view retains the designed four stages, progress area, and framing telemetry. It previews the imported video in its original framing. Measurements remain empty until the engine supplies them; there is no simulated timer or Proceed button. Actual completion automatically routes to Suggestions. Integration must dispatch `analysis-complete` with the current source ID and actual clip results. Stale-source results are ignored. Reloading resets the session; a URL cannot restore a local File. Test fixtures live under `tests/fixtures/` only.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Node.js 20.9+ is required; CI uses Node.js 24.

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

Reserve top-level `services/` for endpoint/API clients. Browser media helpers and pure utilities belong in `lib/`; hooks manage lifecycle and UI behavior. No per-feature service folders are introduced.

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
