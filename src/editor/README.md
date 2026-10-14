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

Pure geometry and serialization helpers belong in [`src/lib`](../lib/README.md)
so they can be unit tested without a canvas.
