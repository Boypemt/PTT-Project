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

**Sending patterns?** [`docs/ADDING_PATTERNS.md`](docs/ADDING_PATTERNS.md) —
Thai and English — is three steps: put the file in the artwork folder, add its
entry to `patterns.manifest.json`, run `npm run catalog:import -- "<folder>"`.
It also covers the export settings, the seamless checklist and the repeat size.

## Stack

| Area      | Choice                                                             |
| --------- | ------------------------------------------------------------------ |
| Framework | React 19 + Vite + TypeScript (strict)                              |
| Styling   | Tailwind CSS v4, eco-print theme tokens in `src/index.css`         |
| State     | Zustand + `zundo` (undo/redo)                                      |
| Canvas    | react-konva v19+ / konva (2D); `@react-three/fiber` v9+ in phase 2 |
| Routing   | react-router-dom                                                   |
| i18n      | react-i18next — Thai default, English toggle                       |
| Data      | `public/catalog/*.json` validated with zod                         |
| Tests     | Vitest + Testing Library, Playwright (e2e)                         |
| Tooling   | ESLint + Prettier, Husky, GitHub Actions, Vercel                   |

Items beyond the scaffold arrive in later tasks — see the roadmap.

## Getting started

Node **24+** (see `.nvmrc`; `nvm use` picks it up).

```bash
npm install      # install dependencies
npm run dev      # dev server with HMR at http://localhost:5173
npm run build    # typecheck, then build to dist/
npm run preview  # serve the production build locally
npm test         # Vitest in watch mode; `npm test -- --run` for one pass
npm run lint     # ESLint (type-aware); lint:fix to autofix
npm run format   # Prettier --write; format:check to verify only
npm run typecheck # TypeScript project references, no emit
```

## Routes

| Path                    | Page                                                |
| ----------------------- | --------------------------------------------------- |
| `/`                     | Landing — the community story (placeholder for now) |
| `/products`             | Product picker — `?line=fabric` filters by line     |
| `/customize/:productId` | The customizer                                      |
| `/dev/catalog`          | Internal preview of every catalog asset             |

`/dev/catalog` ships in **every** build, so the team and the designer can
review mockups, tiles and motifs on the Vercel preview. It is not linked from
the nav and marks itself `noindex` while open.

The language toggle (TH/EN) is in the header; the choice is kept in
localStorage and mirrored onto `<html lang>`.

## Deployment

Vercel, configured by [`vercel.json`](vercel.json): framework `vite`, build
`npm run build`, output `dist`, and a rewrite that sends every unmatched path
to `index.html` so client-side routes survive a page reload. Each PR gets a
preview deployment.

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
recorded in `docs/CREDITS.md`. Short version:
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md); full rules:
[`CLAUDE.md`](CLAUDE.md).
