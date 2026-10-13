Read CLAUDE.md. Branch: `feat/pattern-panel`.

1. Pattern library panel: search box, filter by kind (Tile / Leaf motif) and tag, grid of thumbnails with localized names. Placeholder patterns show a small "placeholder" badge (from `source.type`).
2. Clicking a tile pattern adds a `tile` layer to the currently selected print area (print area selector shown if product has >1 area; respect `allowedKinds`).
3. Implement tile rendering in LayerRenderer: load SVG as image (cache loaded images in a small hook `usePatternImage`), use Konva `fillPatternImage` with repeat, applying scale, rotation, offsetX/offsetY.
4. Properties panel for a selected tile layer: sliders for scale (0.2–3), rotation (0–360), offset X/Y, opacity; delete layer button. Layer list with select, reorder (up/down buttons), delete.
5. Tests: adding a pattern creates correct layer; disallowed kind is not offered; slider updates store.

Commit plan:
- feat(editor): add pattern image loading hook with cache
- feat(editor): render tile layers with pattern fill
- feat(editor): add pattern library panel with search and filters
- feat(editor): add tile layer properties controls
- feat(editor): add layer list with reorder and delete
- test(editor): cover pattern application and properties

Push and open PR.
