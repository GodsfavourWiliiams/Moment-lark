# MomentLark

MomentLark is a browser-based workspace for finding and refining short clips from longer videos. The first development slice establishes the app shell and local video import. AI suggestions, editing, and export will be built in subsequent changes.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Static export for hosting without an application server
- ESLint with Next.js Core Web Vitals and TypeScript rules

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The production build writes a static site to `out/`. The same checks run on pushes to `dev` and pull requests into `master`.

## Branches

- `master`: reviewed changes
- `dev`: integration branch for active work

Work starts on `dev` and reaches `master` through a pull request.
