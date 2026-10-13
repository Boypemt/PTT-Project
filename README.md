# Pa Ton Phueng Product Customizer

An interactive web customizer for **วิสาหกิจชุมชนป่าต้นผึ้ง** (Pa Ton Phueng
Community Enterprise, Doi Saket, Chiang Mai) — a 42-household enterprise that
makes eco-print fabric from real leaves and plates from fallen ใบตองตึง
leaves gathered in their 983-rai community forest.

Visitors pick a product, place community patterns on it, customize colour,
scale and position, see the result live, then save, share or send the design as
an order request. This is a **prototype**: the designer's real patterns arrive
later and must drop in as data only, so the catalog lives in
`public/catalog/*.json` and no component hardcodes a product or pattern.

Full context and the domain model: [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).
The PR-by-PR plan: [`docs/ROADMAP.md`](docs/ROADMAP.md). Working rules for
contributors (and for Claude Code): [`CLAUDE.md`](CLAUDE.md).

## Stack

| Area | Choice |
| --- | --- |
| Framework | React 18 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS v4, eco-print theme tokens in `src/index.css` |
| State | Zustand + `zundo` (undo/redo) |
| Canvas | react-konva / konva (2D); `@react-three/fiber` in phase 2 |
| Routing | react-router-dom |
| i18n | react-i18next — Thai default, English toggle |
| Data | `public/catalog/*.json` validated with zod |
| Tests | Vitest + Testing Library, Playwright (e2e) |
| Tooling | ESLint + Prettier, Husky, GitHub Actions, Vercel |

Items beyond the scaffold arrive in later tasks — see the roadmap.

## Getting started

Node **24+** (see `.nvmrc`; `nvm use` picks it up).

```bash
npm install     # install dependencies
npm run dev     # dev server with HMR at http://localhost:5173
npm run build   # typecheck, then build to dist/
npm run preview # serve the production build locally
```

`npm run typecheck` runs the TypeScript project references on their own.

## Layout

```
src/
  app/          routes, layout, providers
  catalog/      types, zod schemas, loaders, hooks
  editor/       canvas, layers, tools, store
  features/     page-level features (product-picker, export, landing)
  components/   shared UI primitives
  i18n/         th.json, en.json, setup
  lib/          pure helpers (tested)
public/catalog/ products.json, patterns.json, leaf-dyes.json, products/, patterns/
docs/           brief, roadmap, task prompts, credits
```

Each folder has its own README explaining what belongs there.

## Contributing

One branch per task (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`), never
commit to `main`, Conventional Commits, atomic commits that each build and
pass tests. Only public-domain/CC0 or self-drawn assets, every third-party one
recorded in `docs/CREDITS.md`. Details in [`CLAUDE.md`](CLAUDE.md).
