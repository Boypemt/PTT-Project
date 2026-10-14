Read CLAUDE.md and docs/PROJECT_BRIEF.md (Domain model).

This task is too large for one reviewable PR, so it ships as two: **07a** on
`feat/editor-canvas` (the foundation, no canvas) and **07b** on
`feat/editor-konva`, branched from `main` once 07a is merged.

Build the editor foundation on `/customize/:productId`:

## 07a — store, geometry, page

1. Zustand store `src/editor/store.ts` holding a `Design` (productId, baseColor, layers) plus `selectedLayerId` and `selectedPrintAreaId`.
   Selection stays **outside** `Design`: a `Design` is exactly what a share link serializes, and which layer is highlighted is not part of it.
   Actions: initForProduct, setBaseColor, addLayer, updateLayer, removeLayer, reorderLayer, selectLayer, selectPrintArea, reset. Layer ids via `crypto.randomUUID` with a fallback.
   Keep the store free of React and Konva imports (vanilla `createStore`), so `zundo` can wrap it for undo/redo in task 11. Unit-test every action.
2. `src/lib/geometry.ts` for the fit/scale math — contain-fit a W×H mockup in a container, convert between mockup and stage coordinates, clamp helpers — with tests.
3. Page layout: canvas centre; left panel "Patterns"; right panel "Properties" showing the product name, price and base-colour swatches wired to `setBaseColor`; on mobile the panels become a bottom sheet with two tabs and the canvas stays visible above it. Page header: back link to `/products` and the localized product name.
4. Unknown productId → friendly not-found linking back to `/products` (localized).
5. The canvas area holds the DOM `ProductMockup` until 07b, so the base-colour picker is demo-able and 07b has a reference look to match.

Commit plan:
- feat(editor): add design store with actions
- test(editor): cover store actions
- feat(lib): add canvas fit geometry helpers
- feat(editor): add editor page layout and mobile bottom sheet
- feat(editor): add base colour picker and not-found state

## 07b — the Konva canvas

1. `EditorCanvas` with react-konva (v19+): responsive Stage that fits its container via ResizeObserver, keeps the mockup aspect ratio and handles devicePixelRatio.
   Render order: base mockup tinted with baseColor (base image, then tint with `globalCompositeOperation: 'source-in'` on a cached group, or equivalent — it must match `ProductMockup`'s look) → one clipped Group per print area (clipFunc from the rect or the SVG path) holding that area's layers → overlay mockup with `multiply`.
2. Layers are drawn by a `LayerRenderer` switching on `layer.type`; in this PR only a stub that draws a semi-transparent rect, so the clipping can be seen working.
3. Toggle "Show print areas" drawing dashed outlines, reusing the `/dev/catalog` look.
4. Image loading through a small `useImage`-style hook with a cache.
5. Tests: the pure parts only — jsdom has no canvas and the native `canvas` package is not worth a node-gyp build in CI. Say so in the PR; the stage gets e2e coverage in task 14.

Commit plan:
- feat(editor): add image loading hook with cache
- feat(editor): add responsive konva stage with tinted base and overlay
- feat(editor): add print-area clipping and layer renderer stub
- feat(editor): add print area outline toggle

Push and open a PR for each.
