# src/editor

The customizer itself: the react-konva canvas, layer list, tools and state.

- the Konva stage that renders the product mockup, print-area clips and layers
- tool UI for placing, scaling, rotating and recoloring patterns
- the Zustand store (with `zundo` for undo/redo) holding the current `Design`

Pure geometry and serialization helpers belong in [`src/lib`](../lib/README.md)
so they can be unit tested without a canvas.
