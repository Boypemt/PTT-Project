# Roadmap — one prompt = one branch = one PR

Merge each PR into `main` (squash-merge OFF; keep the small commits) before starting the next, unless noted as parallel-safe.
Every PR gets a Vercel preview link once step 02 is done.

| # | Branch | PR title | Prompt | Depends on |
|---|---|---|---|---|
| 01 | `chore/bootstrap` | chore: bootstrap Vite + React + TS + Tailwind | `prompts/01-bootstrap.md` | — |
| 02 | `chore/quality-ci` | chore(ci): lint, test, commit hooks and CI | `prompts/02-quality-ci.md` | 01 |
| 03 | `feat/catalog-model` | feat(catalog): data model, schemas and loaders | `prompts/03-catalog-model.md` | 02 |
| 04 | `feat/placeholder-assets` | feat(catalog): placeholder patterns and product mockups | `prompts/04-placeholder-assets.md` | 03 |
| 05 | `feat/app-shell-i18n` | feat(app): routing, layout and TH/EN i18n | `prompts/05-app-shell-i18n.md` | 02 (parallel with 03/04) |
| 06 | `feat/product-picker` | feat(app): product picker page | `prompts/06-product-picker.md` | 04, 05 |
| 07a | `feat/editor-canvas` | feat(editor): design store, geometry and editor page layout | `prompts/07-editor-canvas.md` | 06 |
| 07b | `feat/editor-konva` | feat(editor): canvas with mockup and print-area clipping | `prompts/07-editor-canvas.md` | 07a |
| 08 | `feat/pattern-panel` | feat(editor): pattern library and tile layers | `prompts/08-pattern-panel.md` | 07b |
| 09 | `feat/motif-transform` | feat(editor): placeable leaf motifs with transform handles | `prompts/09-motif-transform.md` | 08 |
| 10 | `feat/leaf-dye-colors` | feat(editor): recolour by leaf dye and base colour | `prompts/10-leaf-dye-colors.md` | 08 |
| 11 | `feat/history-persist` | feat(editor): undo/redo, autosave and share link | `prompts/11-history-persist.md` | 09, 10 |
| 12 | `feat/export-request` | feat(export): PNG export and order request summary | `prompts/12-export-request.md` | 11 |
| 13 | `feat/landing-story` | feat(app): landing page with community story | `prompts/13-landing-story.md` | 05 |
| 14 | `test/e2e-polish` | test: Playwright happy path, a11y and mobile polish | `prompts/14-e2e-polish.md` | 12 |
| 15 | `docs/designer-handoff` | docs: how to add the real community patterns | `prompts/15-designer-handoff.md` | 12 |
| 16 | `feat/3d-preview` *(phase 2)* | feat(editor): 3D preview tab | `prompts/16-3d-preview.md` | 12 |

## Milestones to show the team
- **M1 (after 06):** live site with product catalogue in TH/EN.
- **M2 (after 10):** working customizer — the demo moment.
- **M3 (after 15):** prototype complete + designer can drop in real patterns.

## Review checklist for each PR (you, before merging)
- [ ] Commits are small and each message explains one change
- [ ] CI green, Vercel preview opens
- [ ] Tried it on phone width
- [ ] No hardcoded pattern/product in components
