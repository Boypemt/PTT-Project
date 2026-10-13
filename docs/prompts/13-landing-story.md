Read CLAUDE.md and docs/PROJECT_BRIEF.md (Client). Branch: `feat/landing-story`.

Landing page `/` in TH/EN:
1. Hero: "ใบไม้ลดไฟป่า กลายเป็นรายได้ / Leaves that prevent forest fires become income", CTA "Design your own / ออกแบบของคุณเอง" → /products.
2. "How eco-print works" 4-step strip (collect leaves → mordant → lay & roll → steam 2 h) with simple SVG icons you draw.
3. Leaf colour showcase from leaf-dyes.json (data-driven).
4. Featured products (bestseller tag) → editor.
5. Community section: 42 households, 983-rai community forest, 5% of revenue to the forest fund. Image slots use neutral placeholders with alt text; mark them clearly so real photos can replace them.
Keep copy in i18n files. Use the frontend aesthetic from Tailwind tokens; avoid generic template look.

Commit plan:
- feat(app): add landing hero
- feat(app): add eco-print process section
- feat(app): add leaf colour showcase and featured products
- feat(app): add community story section

Push and open PR.
