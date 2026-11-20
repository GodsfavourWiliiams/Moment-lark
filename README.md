# ClipFlow · MomentLark

The ClipFlow welcome/import UI, built from the updated Stitch design using Next.js, TypeScript, and Tailwind CSS v4.

This phase is presentation only. File selection displays the filename; it does not read, upload, decode, or cache the media. Sample analysis and workflow navigation open explicit placeholder dialogs. Engine, privacy, codec, and pipeline copy is supplied design content describing the intended product, not an implemented processing engine. Integration will be designed separately.

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
    layout/            Studio navigation/header
  features/welcome/    index.tsx, screen components, static display data
  hooks/               UI behavior and keyboard shortcuts
  state/               One reducer/state file per feature (welcome.ts)
  types/               Shared UI/domain types
  styles/tokens.css    Tailwind theme tokens from Stitch
```

Reserve top-level `services/` for endpoint/API clients and `lib/` for non-API utilities when integration introduces them. No per-feature service folders or empty abstractions are needed for this UI phase.

## Styling and accessibility

Use Tailwind utilities in components. `src/styles/tokens.css` defines the semantic palette, typography, spacing, radii, and shadows with Tailwind's `@theme`. For example: `bg-surface-container-low`, `text-headline-md`, `gap-space-lg`, and `shadow-neon`. Global CSS contains only the font declaration and shared base styles; there are no component CSS files.

Inter is hosted locally in `public/fonts/`. The supplied brand-image URL returned a Google sign-in page, so the header and favicon use a local SVG scissors fallback. SVG icons do not depend on an external icon font.

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
