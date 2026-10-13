Read CLAUDE.md and docs/PROJECT_BRIEF.md (Domain model). Branch: `feat/editor-canvas`.

Build the editor foundation on `/customize/:productId`:
1. Zustand store `src/editor/store.ts` holding a `Design` (productId, baseColor, layers, selectedLayerId) with actions: setBaseColor, addLayer, updateLayer, removeLayer, reorderLayer, selectLayer, reset. Unit-test the reducers/actions.
2. `EditorCanvas` with react-konva: responsive Stage that fits its container (keep mockup aspect ratio, scale coordinates; handle resize and devicePixelRatio).
   Render order: base mockup tinted with baseColor → for each print area a clipped Group (clipFunc from rect/path) containing that area's layers → overlay mockup with multiply blend.
3. Layers are rendered by a `LayerRenderer` switch on `layer.type` (tile/motif); for this PR implement only a stub that draws a semi-transparent rect so clipping can be verified.
4. Page layout: canvas center; left panel placeholder "Patterns"; right panel placeholder "Properties"; on mobile panels become a bottom sheet with tabs.
5. Unknown productId → friendly not-found with link back to /products.
6. `src/lib/geometry.ts` for fit/scale math, with tests.

Commit plan:
- feat(editor): add design store with actions
- test(editor): cover store actions
- feat(lib): add canvas fit geometry helpers
- feat(editor): add responsive konva stage with base and overlay
- feat(editor): add print-area clipping and layer renderer stub
- feat(editor): add editor page layout and mobile bottom sheet

Push and open PR.
