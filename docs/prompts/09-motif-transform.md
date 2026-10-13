Read CLAUDE.md and docs/PROJECT_BRIEF.md. Branch: `feat/motif-transform`.

This mimics real eco-printing: the user lays individual leaves on the fabric.
1. Clicking a motif pattern (or dragging it from the panel onto the canvas — drag & drop if simple, click is required) adds a `motif` layer centered in the print area.
2. Render motifs as Konva Image; selectable; Konva Transformer for move/scale/rotate (keep aspect ratio); works with touch (pinch not required, handles are fine).
3. Keep motifs inside their print area clip; clicking empty canvas deselects.
4. Properties panel for motif: scale, rotation, opacity, duplicate, bring forward/back, delete. Keyboard: arrow keys nudge, Delete removes, Ctrl/Cmd+D duplicates.
5. "Scatter leaves" button: adds 5–8 random leaf motifs at random positions/angles in the selected area (seeded random helper in src/lib with tests) — gives the authentic eco-print look in one click.

Commit plan:
- feat(editor): render motif layers as images
- feat(editor): add transformer for motif move scale rotate
- feat(editor): add motif properties and keyboard shortcuts
- feat(lib): add seeded random helper with tests
- feat(editor): add scatter leaves action
- test(editor): cover motif add, duplicate and delete

Push and open PR.
