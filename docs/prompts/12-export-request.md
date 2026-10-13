Read CLAUDE.md and docs/PROJECT_BRIEF.md. Branch: `feat/export-request`.

No backend. Build the "finish" flow:
1. Export PNG of the canvas at 2x (hide transformer/selection first) — download as `paton-phueng-<product>-<date>.png`.
2. "Request this design / สั่งทำลายนี้" dialog: summary (product, base colour, list of patterns + leaf colours used, price from catalog, note that each piece is handmade so the real print varies), optional name + note fields.
3. Actions: copy summary text, open LINE share URL, open Facebook Messenger/ email mailto with summary + share link. Contact targets come from `public/catalog/contact.json` (placeholder values) — not hardcoded.
4. `src/lib/designSummary.ts` builds the localized summary text — with tests.
5. Show a "Prototype — orders are not processed automatically" notice.

Commit plan:
- feat(export): add png export
- feat(lib): add design summary builder with tests
- feat(catalog): add contact config
- feat(export): add request dialog with share actions

Push and open PR.
