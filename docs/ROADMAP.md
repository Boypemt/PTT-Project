# Roadmap — one prompt = one branch = one PR

Merge each PR into `main` (squash-merge OFF; keep the small commits) before starting the next, unless noted as parallel-safe.
A prompt that turns out too large for one reviewable PR is split into lettered rows, as task 08 was.
Every PR gets a Vercel preview link once step 02 is done.

| # | Status | Branch | PR title | Prompt | Depends on |
|---|---|---|---|---|---|
| 01 | done | `chore/bootstrap` | chore: bootstrap Vite + React + TS + Tailwind | `prompts/01-bootstrap.md` | — |
| 02 | done | `chore/quality-ci` | chore(ci): lint, test, commit hooks and CI | `prompts/02-quality-ci.md` | 01 |
| 03 | done | `feat/catalog-model` | feat(catalog): data model, schemas and loaders | `prompts/03-catalog-model.md` | 02 |
| 04 | done | `feat/placeholder-assets` | feat(catalog): placeholder patterns and product mockups | `prompts/04-placeholder-assets.md` | 03 |
| 05 | done | `feat/app-shell-i18n` | feat(app): routing, layout and TH/EN i18n | `prompts/05-app-shell-i18n.md` | 02 (parallel with 03/04) |
| 06 | done | `feat/product-picker` | feat(app): product picker page | `prompts/06-product-picker.md` | 04, 05 |
| 07a | done | `feat/editor-canvas` | feat(editor): design store, geometry and editor page layout | `prompts/07-editor-canvas.md` | 06 |
| 07b | done | `feat/editor-konva` | feat(editor): canvas with mockup and print-area clipping | `prompts/07-editor-canvas.md` | 07a |
| 08a | done | `feat/tile-rendering` | feat(editor): render tile layers and split the customizer chunk ([#12](https://github.com/Boypemt/PTT-Project/pull/12)) | `prompts/08-pattern-panel.md` | 07b |
| 08b | done | `feat/pattern-panel` | feat(editor): pattern library and tile layers ([#13](https://github.com/Boypemt/PTT-Project/pull/13)) | `prompts/08-pattern-panel.md` | 08a |
| 08c | done | `feat/layer-controls` | feat(editor): layer properties and layer list | `prompts/08-pattern-panel.md` | 08b |
| 09a | done | `feat/motif-layers` | feat(editor): placeable leaf motifs with transform handles (behind `motifs`) | `prompts/09-motif-transform.md` | 08c |
| 09b | done | `feat/motif-scatter` | feat(editor): scatter leaves, motif properties and keyboard ([#22](https://github.com/Boypemt/PTT-Project/pull/22)) | `prompts/09-motif-transform.md` | 09a |
| 09c | done | `chore/graduate-motifs` | refactor(editor): graduate motifs from the feature flag ([#24](https://github.com/Boypemt/PTT-Project/pull/24)) | — | 09b |
| 10 | done | `feat/leaf-dye-colors` | feat(editor): recolour by leaf dye and base colour | `prompts/10-leaf-dye-colors.md` | 08c |
| 11 | **todo** | `feat/history-persist` | feat(editor): undo/redo, autosave and share link | `prompts/11-history-persist.md` | 09b, 10 |
| 12 | **todo** | `feat/export-request` | feat(export): PNG export and order request summary | `prompts/12-export-request.md` | 11 |
| 13 | done | `feat/landing-story` | feat(app): landing page with community story | `prompts/13-landing-story.md` | 05 |
| 14 | partly | `test/e2e-polish` | test: Playwright happy path, a11y and mobile polish | `prompts/14-e2e-polish.md` | 12 |
| 15 | partly | `docs/designer-handoff` | docs: how to add the real community patterns | `prompts/15-designer-handoff.md` | 12 |
| 16 | **todo** | `feat/3d-preview` *(phase 2)* | feat(editor): 3D preview tab | `prompts/16-3d-preview.md` | 12 |
| 17 | done | `chore/release-safety` | test: Playwright e2e suite and the CI job that guards the demo ([#17](https://github.com/Boypemt/PTT-Project/pull/17)) | — (ad-hoc) | 13 |
| 18 | done | `chore/flags-and-release-docs` | feat(lib): feature flags, releasing guide and changelog ([#18](https://github.com/Boypemt/PTT-Project/pull/18)) | — (ad-hoc) | 17 |
| 19 | done | `feat/community-patterns` | feat(catalog): the designer's first community patterns ([#28](https://github.com/Boypemt/PTT-Project/pull/28)) | — (ad-hoc) | 10 |
| 20 | done | `feat/pattern-manifest` | feat(catalog): import patterns from a manifest ([#29](https://github.com/Boypemt/PTT-Project/pull/29)) | — (ad-hoc) | 19 |
| 21 | done | `feat/patterns-v2` | feat(catalog): the designer's v2 patterns, recolourable with leaf dyes ([#31](https://github.com/Boypemt/PTT-Project/pull/31)) | — (ad-hoc) | 20 |
| 22 | done | `feat/import-period-crop` | feat(catalog): cut each pattern to its own repeat, so the tiles stop showing seams ([#32](https://github.com/Boypemt/PTT-Project/pull/32)) | — (ad-hoc) | 21 |
| 23 | done | `test/stabilize-flaky-tests` | test: fix the two races behind the intermittent suite failures ([#33](https://github.com/Boypemt/PTT-Project/pull/33)) | — (ad-hoc) | 17 |

**Where 14 stands.** 17 took most of it: the Playwright setup and CI job, the demo journey at
both widths, the axe pass, and the editor route was already lazy-loaded in 08a. What is left for
14 is the part that needs features that do not exist yet — the motif, undo and export steps of
the happy path — plus the bundle-size check and preloading pattern thumbnails.

**Where 15 stands.** 19 and 20 took the pattern half of it: `docs/ADDING_PATTERNS.md`, the
manifest-driven import and the schema the real patterns needed — adding or revising a pattern
is now one command. What is left for 15 is `docs/ADDING_PRODUCTS.md`, the
`npm run catalog:check` script and its CI step, and the `hidePlaceholders` flag — which now
has real patterns to hide the placeholders behind.

## Milestones to show the team
- **M1 (after 06):** live site with product catalogue in TH/EN. ✅
- **M2 (after 10):** working customizer — the demo moment. ✅ tiles, leaf dyes, the base cloth
  and leaf motifs (09) are all in.
- **M3 (after 15):** prototype complete + designer can drop in real patterns. The designer half
  is done and shipped in v0.3.0 — the patterns are real and a revision is one command.
  Remaining: 11, 12, what is left of 15, and what is left of 14.

Promoting a milestone to the demo link is `docs/RELEASING.md`; what each one contained is
`CHANGELOG.md`.

## Review checklist for each PR (you, before merging)
- [ ] Commits are small and each message explains one change
- [ ] CI green, Vercel preview opens
- [ ] Tried it on phone width
- [ ] No hardcoded pattern/product in components
