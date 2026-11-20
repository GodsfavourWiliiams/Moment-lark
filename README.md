# Moment Lark

Moment Lark is a browser video clipping workspace built from the supplied Stitch designs with Next.js, TypeScript, and Tailwind CSS v4.

The Import, in-place Analysis preview, Suggestions (`/suggestions`), and Editor (`/editor?clip=2`) screens share one layout and navigation. Suggestions and Editor use the same clip document, so titles, trim bounds, captions, framing, review decisions, and queue totals remain consistent when navigating. The supplied podcast images and four suggestions are explicit design fixtures, not generated AI results.

The media foundation uses **Remotion Player**, **@remotion/media**, and **@remotion/web-renderer**. The UI retains the supplied layout and controls; Remotion handles composition playback and rendering. One composition drives preview and export. Mediabunny reads local metadata and samples bounded audio windows for the timeline.

Local file import creates one manual clip. Playback, frame-grid trim controls, original source framing by default, optional 9:16 / 1:1 crops, manual horizontal crop positioning, title overlays, timed captions, undo/redo, keep/dismiss, and a kept-clip queue are implemented. The queue can request an H.264/AAC MP4 render, show progress, cancel, and download the result on supported browsers. Demo still images cannot be exported as video.

Automatic transcription, AI highlight ranking, active-speaker tracking, persistent project storage, batch export, and dedicated Clips/Export pages remain future work. Analysis is still a clearly marked simulation on the Import route. A reload resets the editing session; a URL cannot restore a local File.

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
  config/              Brand, navigation routes, shortcuts, demo fixture
  features/welcome/    Import screen components and display data
  features/analysis/   Analysis state view, components, and preview fixtures
  features/suggestions/ Ranked cards, filters, source timeline, decision bar
  features/editor/     Clip editing panels and precision timeline
  hooks/               UI behavior and keyboard shortcuts
  state/               Per-feature reducers and contexts (studio, editing)
  lib/                 Timecode, crop geometry, local media input/export
  types/               Shared UI/domain types
  styles/tokens.css    Tailwind theme tokens from Stitch
```

Reserve top-level `services/` for endpoint/API clients. Browser media helpers and pure utilities belong in `lib/`; hooks manage lifecycle and UI behavior. No per-feature service folders are introduced.

## Styling and accessibility

Use Tailwind utilities in components. `src/styles/tokens.css` defines the semantic palette, typography, spacing, radii, and shadows with Tailwind's `@theme`. For example: `bg-surface-container-low`, `text-headline-md`, `gap-space-lg`, and `shadow-neon`. Global CSS contains only the font declaration and shared base styles; there are no component CSS files.

The root layout owns the header, main landmark, provider, and dialogs. `src/config/navigation.ts` is the single source for workflow labels and routes. Suggestions and Editor are active routes; the dedicated Clips and Export destinations retain placeholders until their designs are supplied.

Inter is hosted locally in `public/fonts/`. `Logo` accepts `variant="mark"`, `variant="text"`, or `variant="both"` (default). The brand mark is a local SVG reconstructed from the supplied visual reference: a dark rounded tile with lime bars and rings joined by a white diagonal connector. Its path is configured in `src/config/brand.ts`; the favicon uses the same artwork. SVG icons do not depend on an external icon font.

The UI includes semantic landmarks/headings, a skip link, keyboard-operable controls, focus outlines, reduced-motion variants, announced file-selection/error states, and native dialogs with Escape handling, focus containment, and focus restoration. Single-letter O opens the picker only while the import section has focus. Cmd/Ctrl+K opens shortcut help. Editor single-letter shortcuts are scoped to the focused workspace and do not intercept text inputs, buttons, links, sliders, or open dialogs. Trim handles support pointer capture and keyboard adjustments, with editable timecodes as an alternative.

## Media constraints

Codec decoding and H.264/AAC encoding depend on browser capabilities; unsupported files and export configurations produce errors rather than silent success. MOV is a container, not a promise that every ProRes variant will decode. The timeline uses a normalized frame grid derived from the source; variable-frame-rate recordings are not guaranteed source-frame-exact cuts. Exports re-encode rather than performing lossless bitstream copying.

Original framing preserves source dimensions on export and fits the full source into the preview without cropping. Geometry tests cover landscape, portrait, square, and 4:3 sources, including preview/export crop alignment. Rotated-file metadata still needs a broader real-media test matrix. Long-file memory, cancellation, codec coverage, and browser compatibility also require a broader media test matrix.

Remotion's [license terms](https://www.remotion.dev/license) apply. Where required, configure `NEXT_PUBLIC_REMOTION_LICENSE_KEY` at build time; this is a browser-visible license key, not a private API credential. The web renderer reports usage/licensing metadata to Remotion. Media processing stays local, but the application must not be described as fully air-gapped or telemetry-free. The existing welcome/analysis pipeline copy describes the intended product, not all current capabilities.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

A local 10-second MP4 was loaded through an isolated verification fixture, trimmed from 1–3 seconds, cropped to 9:16, and exported through the actual queue UI in Safari. The downloaded output contained 60 AVC frames at 30 fps, 1080×1920 video and AAC audio; a decoded frame confirmed the title and timed caption. The temporary fixture was removed afterward. Native file-picker confirmation could not be verified in the automated Safari session.

The production build produces `out/` for static hosting. CI runs these checks on pushes to `dev`/`master` and pull requests into `master`.

## Branches

- `master`: reviewed changes
- `dev`: integration branch for active work

Work starts on `dev` and reaches `master` through a pull request.
