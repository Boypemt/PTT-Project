Read CLAUDE.md and docs/PROJECT_BRIEF.md (Products, Placeholder patterns). Branch: `feat/placeholder-assets`.

Create placeholder assets as hand-written SVG (no downloads, no copyrighted material):

A. Product mockups in `public/catalog/products/` — clean flat-illustration style, neutral light base, each with:
   - `<id>-base.svg` (silhouette, fill white so base colour can tint it) and `<id>-overlay.svg` (soft folds/shading in grey, used with multiply blend).
   - Products: shawl-cotton, shawl-silk (reuse shawl shape, different overlay sheen), handkerchief, shirt-women, shirt-men, wrap-cloth (furoshiki-style square), leaf-plate (round 6" plate seen from top), fan, keychain (round fabric tag), mug, tumbler.
   - Consistent viewBox per product (e.g. 1000x1000) so print-area coords are simple.
B. Patterns in `public/catalog/patterns/`:
   - Tiles (seamless, recolourable via `currentColor` or CSS vars `--c1`, `--c2`): seigaiha, asanoha, houndstooth, polka, ikat-stripe, original simple scroll inspired by Thai lai (draw your own, don't copy).
   - Motifs (single leaf silhouettes with vein detail, eco-print look, recolourable): teak, golden-teak, mango, marigold-flower, pheka, takhop, tong-tung.
   - One "eco-print scatter" tile combining several leaves at random angles with slight transparency — this is the most on-brand placeholder.
C. Fill products.json (all 11 products from the brief, correct prices/status, printAreas with clip rect or path matching the mockups, sensible baseColors) and patterns.json (all patterns above, `source.type: "placeholder"`, credit "Generated placeholder", license "CC0", leafIds for leaf motifs).
D. `docs/CREDITS.md` listing all assets as self-generated.
E. Dev-only page `/dev/catalog` (route can be a simple conditional render in App for now) showing every product and pattern thumbnail, so I can eyeball them. Remove nothing else.

Commit plan (split by group, not one giant commit):
- feat(catalog): add fabric product mockups
- feat(catalog): add leaf, gift and drinkware mockups
- feat(catalog): add geometric tile patterns
- feat(catalog): add leaf motif patterns
- feat(catalog): add eco-print scatter tile
- feat(catalog): populate products and patterns manifests
- docs: add credits
- chore: add dev catalog preview page

Run the loader tests against the full catalog. Push and open PR with screenshots of /dev/catalog if you can produce them (Playwright screenshot is fine).
