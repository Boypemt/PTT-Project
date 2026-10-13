Read CLAUDE.md and docs/PROJECT_BRIEF.md. Branch: `docs/designer-handoff`.

Make swapping in the real community patterns a no-code task:
1. `docs/ADDING_PATTERNS.md` (Thai + English): file format requirements (SVG preferred; how to make it recolourable with currentColor / --c1 --c2; PNG fallback size; seamless tile checklist; motif with transparent background), naming, where to put files, JSON entry example, how to set `source.type: "community"`, leafIds, how to test locally, and what the validation error looks like.
2. `docs/ADDING_PRODUCTS.md`: mockup base/overlay requirements, how to define print areas (with a diagram), example entry.
3. Script `npm run catalog:check` (node script using the same zod schemas via tsx) that validates the JSON + checks asset files exist; add to CI.
4. Feature flag in catalog root `"hidePlaceholders": false` — when true, placeholder patterns are hidden from the library. Test it.
5. Update README with a "For designers" section linking to these docs.

Commit plan:
- feat(catalog): add catalog check script and ci step
- feat(catalog): add hidePlaceholders flag
- docs: add guide for adding patterns
- docs: add guide for adding products
- docs: link designer guides in readme

Push and open PR.
