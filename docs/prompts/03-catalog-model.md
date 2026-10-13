Read CLAUDE.md and docs/PROJECT_BRIEF.md (section "Domain model"). Branch: `feat/catalog-model`.

Build the data layer — no UI yet.
1. `src/catalog/types.ts` — types exactly per the brief (Localized, AssetSource, LeafDye, Pattern, PrintArea, Product, Layer, Design).
2. `src/catalog/schemas.ts` — zod schemas mirroring the types; derive types with z.infer where sensible so they can't drift. Add `catalogVersion` field to each JSON file root: `{ "catalogVersion": 1, "items": [...] }`.
3. `src/catalog/loaders.ts` — fetch `/catalog/products.json`, `/catalog/patterns.json`, `/catalog/leaf-dyes.json`, validate, and return typed data. On failure throw a `CatalogError` whose message names the file and the failing item id/index and zod path (this is what the designer will see).
4. Cross-file validation: every color referenced exists or is valid hex; ids unique; pattern `leafIds` reference existing leaf dyes.
5. `src/catalog/useCatalog.ts` — React hook (simple context provider + loading/error state; no extra library).
6. Seed `public/catalog/leaf-dyes.json` with all 6 leaves from the brief. Seed products.json with ONE product (handkerchief) and patterns.json with ONE pattern, using placeholder asset paths (assets come in the next PR) — enough to test loading.
7. Unit tests: valid catalog passes; duplicate id fails; bad hex fails; unknown leafId fails; error message contains file + id.

Commit plan:
- feat(catalog): add domain types
- feat(catalog): add zod schemas
- feat(catalog): add loaders with descriptive errors
- feat(catalog): add cross-reference validation
- feat(catalog): add catalog provider and hook
- feat(catalog): seed leaf dyes and minimal catalog
- test(catalog): cover schema and cross-reference validation

Push and open PR.
