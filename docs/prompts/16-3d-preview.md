Phase 2 — only start when I say so. Read CLAUDE.md. Branch: `feat/3d-preview`.

1. Add @react-three/fiber and @react-three/drei. Lazy-loaded "3D" tab next to the 2D canvas.
2. Products get optional `model3d: { src: string; materialName: string }` in schema. Ship one simple placeholder model you generate in code (e.g. a draped cloth plane or a cylinder for the mug) — no downloaded models.
3. Texture = the 2D Konva canvas exported to a CanvasTexture, updated (debounced) when the design changes.
4. OrbitControls, soft lighting, reset view button; fall back gracefully if WebGL unavailable.
5. Document how to plug in the team's existing .glb models (UV mapping requirement) in docs/ADDING_PRODUCTS.md.

Commit plan:
- chore(deps): add react-three-fiber and drei
- feat(catalog): add optional 3d model field
- feat(editor): add 3d preview tab with placeholder model
- feat(editor): sync design canvas to 3d texture
- docs: document adding 3d models

Push and open PR.
