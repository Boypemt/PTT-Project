# src/editor

The customizer itself: the react-konva canvas, layer list, tools and state.

- the Konva stage that renders the product mockup, print-area clips and layers
- tool UI for placing, scaling, rotating and recoloring patterns
- the Zustand store (with `zundo` for undo/redo) holding the current `Design`

`store.ts` is the state itself and imports neither React nor Konva: its actions
test as plain functions, and `zundo`'s `temporal` will wrap the same creator in
task 11. `useDesignStore.ts` is the only place React meets it — components
select the slice they need from there.

What a visitor has selected lives next to the `Design`, not inside it, because
a `Design` is exactly what a share link serializes.

A tile layer reaches the cloth through three small files: `useImage.ts` decodes
the pattern SVG once per URL, `usePatternImage.ts` redraws it to a canvas at 2×
so Konva's pattern fill has pixels to spare, and `tileFill.ts` turns the layer's
scale, rotation and offset into the `fillPattern*` props — the fill moves, the
rectangle under it never does, so a rotated pattern cannot leave a print area
half bare.

Pure geometry and serialization helpers belong in [`src/lib`](../lib/README.md)
so they can be unit tested without a canvas.
