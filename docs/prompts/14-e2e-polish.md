Read CLAUDE.md. Branch: `test/e2e-polish`.

1. Playwright setup (use system browsers config compatible with CI), script `test:e2e`, add job to CI.
2. Happy path e2e: open landing → products → customize shawl → add tile pattern → change leaf colour → add motif → undo → export dialog opens → share link reload restores design. Run at desktop and mobile (Pixel 7) viewports.
3. Accessibility pass: axe check in e2e on main pages, fix violations; visible focus styles; aria labels on icon buttons.
4. Performance: lazy-load the editor route, check bundle size, preload pattern thumbnails sensibly.
5. Fix any mobile layout issues found.

Commit plan:
- test: add playwright setup and ci job
- test: add customizer happy path e2e
- fix(ui): resolve accessibility issues
- perf(app): lazy-load editor route
- fix(ui): mobile layout fixes

Push and open PR.
