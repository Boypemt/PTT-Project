# Pa Ton Phueng Product Customizer — rules for Claude Code

Read `docs/PROJECT_BRIEF.md` once at the start of every task: it holds the client context and the domain model.
`docs/ROADMAP.md` lists the PR sequence. Task prompts live in `docs/prompts/`.

This is a **prototype**: an interactive web customizer where visitors put community patterns onto products.
Real patterns from the designer are NOT ready yet. Everything must work with placeholder data and accept the
real data later **without code changes**.

## Stack (agreed — do not add libraries outside this list without asking)
- React 19 + Vite + TypeScript (strict)
- Tailwind CSS
- Zustand (+ `zundo` for undo/redo) for editor state
- react-konva / konva for the 2D canvas — **react-konva must be v19+** (v18 targets React 18)
- react-router-dom for routing
- react-i18next (Thai default, English toggle)
- zod for validating catalog JSON
- Vitest + Testing Library (unit), Playwright + @axe-core/playwright (e2e, chromium only)
- ESLint + Prettier, Husky + lint-staged + commitlint
- GitHub Actions CI, Vercel hosting
- Phase 2 only: @react-three/fiber + drei for 3D preview — **@react-three/fiber must be v9+** (v8 targets React 18)

## Golden rule: the catalog is data
- Products, patterns and leaf dyes live in `public/catalog/*.json` + asset files under `public/catalog/`.
- Components never import or hardcode a specific pattern or product. They read through `src/catalog/` loaders.
- Every catalog entry is validated with zod at load time. On invalid data, show a clear error naming the file + entry id.
- Placeholder entries carry `"source": { "type": "placeholder", ... }` so they can be filtered or replaced later.

## Git workflow (mandatory)
- **Before ANY commit, run `git branch --show-current`; if it prints `main` or `release`, stop and create a branch.**
  A merge leaves the checkout on `main`, so the branch you are on is not the branch you last chose.
- **Never run a destructive git command without asking me first.** That means
  `git checkout -- .`, `git checkout <ref> -- .`, `git reset --hard`, `git clean -fd` and
  `git push --force`. This holds **even when everything is committed** and the command looks
  safe — "it's all committed" is a belief about the working tree, and these are exactly the
  commands that destroy the evidence when that belief is wrong. Ask first, and say what you
  expect the command to throw away. There is almost always a non-destructive way to get the
  same answer: `git stash push -- <paths>` to set changes aside, `git switch -c` or
  `git worktree add` to look at another branch, `git restore --staged` to unstage.
- Never commit to `main`. One branch per task: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`.
- **Atomic commits** — each commit is ONE logical change that you can describe in one Conventional Commit line,
  and the project builds and passes tests at every commit. Never dump the whole task into a single commit at the end,
  and never split a change artificially so that a commit is left broken. Don't mix unrelated changes (e.g. reformatting + feature).
  Follow the "Commit plan" in the task prompt as a guide; adjust it if the logical boundaries turn out different.
- Keep each PR reviewable: aim for ≤ ~400 lines of hand-written code (lockfiles, generated assets and scaffolding don't count).
  If a task grows beyond that, stop and propose splitting it into two PRs.
- Conventional Commits: `feat(editor): add pattern scale slider`. Scopes: `app, catalog, editor, lib, ui, i18n, export, ci, deps, docs`.
- Before every commit (once the scripts exist): `npm run lint && npm run typecheck && npm test -- --run`.
- Before pushing, check the branch's PR state with `gh pr view`; never push to a branch whose PR is merged or closed —
  create a new branch from main instead. One branch = one PR.
- When finished: push the branch and open a PR with `gh pr create` using the PR template. If `gh` is unavailable, push and print the PR title + body for me.
- Don't merge PRs yourself.

## Release safety — `main` must never break the demo
`main` is what the demo link is promoted from; the flow, the tags and the rollback are in
`docs/RELEASING.md`.
- **A feature that isn't finished goes in behind a flag.** Add it to `src/lib/flags.ts` and gate
  it with `isEnabled()` from its first commit; deleting the flag is the last commit of that
  feature. Vercel's Preview environment sets `VITE_FLAGS`, Production leaves it unset — so
  unfinished work lives in `main` rather than on a branch that rots, and visitors never meet it.
- **The e2e suite is part of the gate.** `npm run test:e2e` passes before you open a PR, and the
  `E2E (Playwright, chromium)` check is green before it is merged. The visual tests skip off
  Linux; that is expected, CI runs them in the container the baselines were made in.
- **Say when a screenshot baseline changes on purpose.** A UI change that moves
  `e2e/__screenshots__/` is reported in the PR body, and the baselines are refreshed with the
  "Visual baselines" workflow — a reviewer cannot tell an intended change from a regression by
  looking at the diff.
- Every release goes in `CHANGELOG.md` under the version it shipped in.

## Code conventions
- Function components, PascalCase file per component, hooks named `useXxx`. No `any`; prefer discriminated unions.
- Folder layout:
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
  ```
- All user-visible text goes through `t()`; add every key to both `th.json` and `en.json`.
- Mobile-first, touch-friendly (min 44px targets). Keyboard accessible controls with labels.
- Pure logic (geometry, price calc, design serialization) lives in `src/lib` with unit tests.

## Assets & licensing
- Only public-domain / CC0 images or assets you generate yourself (SVG drawn in code is preferred).
- Never use brand-owned patterns (e.g. LV monogram, Burberry check, Disney, etc.).
- Record every third-party asset in `docs/CREDITS.md` (name, source URL, license).

## Definition of done for each task
Lint, typecheck, unit tests, `npm run build` and `npm run test:e2e` pass. New logic has tests.
UI strings in both languages.
For any UI change, run `npm run build && npm run shot -- <page>` for desktop and `--mobile`, look at the
images yourself, and fix what's wrong before opening the PR. List the pages you checked in the PR body.
Finish by summarizing: what changed, commits made, and what I should test manually.
