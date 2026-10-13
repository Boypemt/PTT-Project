Read CLAUDE.md and docs/PROJECT_BRIEF.md. Branch: `feat/product-picker`.

Build `/products`:
1. Grid of product cards from the catalog: mockup image, localized name, price (format "฿259", ranges "฿59–89"), "Customize" button → `/customize/:id`.
2. Filter chips by line (All, Fabric, Leaf, Gift, Drinkware). `planned` products show a "Coming soon / เร็วๆ นี้" badge but are still customizable (label them "concept").
3. Highlight best sellers (shawl-cotton, handkerchief) — drive this from a `tags: ["bestseller"]` field in products.json, NOT hardcoded ids (add the field to schema).
4. `src/lib/price.ts` formatting helper with tests.
5. Responsive: 1 col phone, 2 tablet, 3–4 desktop. Cards keyboard-focusable.

Commit plan:
- feat(catalog): add product tags to schema and data
- feat(lib): add price formatting helper with tests
- feat(app): add product card component
- feat(app): add product grid with line filter
- test(app): cover filter and navigation

Push and open PR.
