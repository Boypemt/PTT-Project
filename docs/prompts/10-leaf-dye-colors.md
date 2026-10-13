Read CLAUDE.md and docs/PROJECT_BRIEF.md (Leaf dyes). Branch: `feat/leaf-dye-colors`.

1. Recolouring: for `recolorable` patterns, build a coloured image from the SVG by injecting colours (replace currentColor / set CSS vars --c1, --c2 in the SVG text, then make a blob URL). Cache by patternId+colors. Put the SVG string transform in `src/lib/svgColor.ts` with tests.
2. Colour picker UI in properties panel: primary section "Leaf dyes / สีจากใบไม้" showing each leaf with its colour swatches (localized leaf name + tooltip colour name). Secondary "Custom colour" input (hex) collapsed by default.
3. Base colour picker for the product from `product.baseColors`.
4. Small info popover per leaf: "This colour comes from ใบสัก…" — text from leaf-dyes.json (add optional `description: Localized` to schema & data).
5. Tests for svgColor and colour selection updating the layer.

Commit plan:
- feat(lib): add svg recolour helper with tests
- feat(editor): render recoloured pattern images with cache
- feat(catalog): add leaf dye descriptions
- feat(editor): add leaf dye colour picker
- feat(editor): add product base colour picker

Push and open PR.
