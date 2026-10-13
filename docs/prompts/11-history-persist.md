Read CLAUDE.md. Branch: `feat/history-persist`.

1. Undo/redo with `zundo` temporal middleware on the design store (ignore selection changes; throttle slider drags so one drag = one history step). Toolbar buttons + Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z.
2. Autosave current design per product to localStorage (versioned key, try/catch, ignore corrupt data) and restore on return; "Start over" button with confirm UI (not window.confirm).
3. Share link: `src/lib/designCodec.ts` — serialize Design → compact JSON → compress (lz-string is acceptable; ask if you prefer native CompressionStream) → base64url in `?d=`. Opening a link loads that design. Validate decoded designs with zod; ignore layers whose pattern no longer exists and show a notice.
4. Copy-link button with "Copied" toast.
5. Tests: codec round-trip, invalid input handled, missing pattern dropped.

Commit plan:
- feat(editor): add undo redo history
- feat(editor): add history toolbar and shortcuts
- feat(editor): add local autosave and start over
- feat(lib): add design codec with tests
- feat(editor): add share link load and copy

Push and open PR.
