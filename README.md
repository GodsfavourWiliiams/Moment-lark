# Moment Lark

The Moment Lark welcome/import and analysis UI, built from the supplied Stitch designs using Next.js, TypeScript, and Tailwind CSS v4.

This phase is presentation only. File selection captures the filename and size; it does not read, upload, decode, or cache the media. Selecting a file or the sample switches Import to an analysis preview with simulated progress and telemetry. Engine, privacy, codec, and pipeline copy describes the intended product, not an implemented processing engine. Integration will be designed separately.

Analysis is an in-place workflow state on the Import route, not a separate page, URL parameter, or modal. A URL alone cannot restore a local file or processing job. Cancel returns to Import and restores focus to the initiating control. Suggestions becomes available when the preview completes, opening a placeholder until that screen is implemented.

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
    providers/         Shared studio context and UI actions
  config/              Brand, navigation routes, shortcuts, demo fixture
  features/welcome/    Import screen components and display data
  features/analysis/   Analysis state view, components, and preview fixtures
  hooks/               UI behavior and keyboard shortcuts
  state/               Shared workflow reducer (studio.ts) and context
  types/               Shared UI/domain types
  styles/tokens.css    Tailwind theme tokens from Stitch
```

Reserve top-level `services/` for endpoint/API clients and `lib/` for non-API utilities when integration introduces them. No per-feature service folders or empty abstractions are needed for this UI phase.

## Styling and accessibility

Use Tailwind utilities in components. `src/styles/tokens.css` defines the semantic palette, typography, spacing, radii, and shadows with Tailwind's `@theme`. For example: `bg-surface-container-low`, `text-headline-md`, `gap-space-lg`, and `shadow-neon`. Global CSS contains only the font declaration and shared base styles; there are no component CSS files.

The root layout owns the header, main landmark, provider, and dialogs. `src/config/navigation.ts` is the single source for workflow labels and routes. Future destinations open placeholders until their pages exist.

Inter is hosted locally in `public/fonts/`. `Logo` accepts `variant="mark"`, `variant="text"`, or `variant="both"` (default). The brand mark is a local SVG reconstructed from the supplied visual reference: a dark rounded tile with lime bars and rings joined by a white diagonal connector. Its path is configured in `src/config/brand.ts`; the favicon uses the same artwork. SVG icons do not depend on an external icon font.

The UI includes semantic landmarks/headings, a skip link, keyboard-operable controls, focus outlines, reduced-motion variants, announced file-selection/error states, and native dialogs with Escape handling, focus containment, and focus restoration. Single-letter O opens the picker only while the import section has focus. Cmd/Ctrl+K opens shortcut help. Editor shortcuts are display-only until integration.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

The production build produces `out/` for static hosting. CI runs these checks on pushes to `dev`/`master` and pull requests into `master`.

## Branches

- `master`: reviewed changes
- `dev`: integration branch for active work

Work starts on `dev` and reaches `master` through a pull request.
