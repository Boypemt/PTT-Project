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
| 09b | in review | `feat/motif-scatter` | feat(editor): scatter leaves, motif properties and keyboard | `prompts/09-motif-transform.md` | 09a |
| 09c | **todo** | `chore/drop-motifs-flag` | chore(lib): remove the motifs flag once it is checked on staging | — | 09b |
| 10 | done | `feat/leaf-dye-colors` | feat(editor): recolour by leaf dye and base colour | `prompts/10-leaf-dye-colors.md` | 08c |
| 11 | **todo** | `feat/history-persist` | feat(editor): undo/redo, autosave and share link | `prompts/11-history-persist.md` | 09b, 10 |
| 12 | **todo** | `feat/export-request` | feat(export): PNG export and order request summary | `prompts/12-export-request.md` | 11 |
| 13 | done | `feat/landing-story` | feat(app): landing page with community story | `prompts/13-landing-story.md` | 05 |
| 14 | partly | `test/e2e-polish` | test: Playwright happy path, a11y and mobile polish | `prompts/14-e2e-polish.md` | 12 |
| 15 | **todo** | `docs/designer-handoff` | docs: how to add the real community patterns | `prompts/15-designer-handoff.md` | 12 |
| 16 | **todo** | `feat/3d-preview` *(phase 2)* | feat(editor): 3D preview tab | `prompts/16-3d-preview.md` | 12 |
| 17 | done | `chore/release-safety` | test: Playwright e2e suite and the CI job that guards the demo ([#17](https://github.com/Boypemt/PTT-Project/pull/17)) | — (ad-hoc) | 13 |
| 18 | in review | `chore/flags-and-release-docs` | feat(lib): feature flags, releasing guide and changelog | — (ad-hoc) | 17 |

**Where 14 stands.** 17 took most of it: the Playwright setup and CI job, the demo journey at
both widths, the axe pass, and the editor route was already lazy-loaded in 08a. What is left for
14 is the part that needs features that do not exist yet — the motif, undo and export steps of
the happy path — plus the bundle-size check and preloading pattern thumbnails.

## Milestones to show the team
- **M1 (after 06):** live site with product catalogue in TH/EN. ✅
- **M2 (after 10):** working customizer — the demo moment. ✅ tiles, leaf dyes and the base
  cloth are in; motifs (09) are not.
- **M3 (after 15):** prototype complete + designer can drop in real patterns. Remaining: 09b, 09c,
  11, 12, 15, and what is left of 14.

Promoting a milestone to the demo link is `docs/RELEASING.md`; what each one contained is
`CHANGELOG.md`.

## Review checklist for each PR (you, before merging)
- [ ] Commits are small and each message explains one change
- [ ] CI green, Vercel preview opens
- [ ] Tried it on phone width
- [ ] No hardcoded pattern/product in components
