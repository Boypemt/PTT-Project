Read CLAUDE.md. Branch from latest main: `chore/quality-ci`.

Set up code quality and CI:
1. ESLint (flat config) with typescript-eslint, react-hooks, react-refresh, jsx-a11y. Prettier + eslint-config-prettier. Scripts: `lint`, `lint:fix`, `format`, `typecheck` (tsc --noEmit).
2. Vitest + @testing-library/react + jsdom. Script `test`. Add one trivial smoke test rendering App.
3. Husky + lint-staged (eslint --fix + prettier on staged files) + commitlint with config-conventional (commit-msg hook).
4. GitHub Actions `.github/workflows/ci.yml`: on PR and push to main → npm ci, lint, typecheck, test --run, build. Node from .nvmrc, npm cache.
5. `.github/pull_request_template.md` (Summary / Changes / How to test / Screenshots / Checklist) and `.github/ISSUE_TEMPLATE/` bug + feature.
6. `docs/CONTRIBUTING.md`: branch naming, commit convention, PR flow (short).
7. `vercel.json` with SPA rewrite to index.html. Do NOT try to log in to Vercel; at the end tell me the steps to import the repo in Vercel (framework Vite, build `npm run build`, output `dist`).

Commit plan:
- chore(ci): add eslint and prettier
- test: add vitest and smoke test
- chore(ci): add husky, lint-staged and commitlint
- chore(ci): add github actions workflow
- docs: add pr template, issue templates and contributing guide
- chore: add vercel spa config

Make sure everything passes, push, open PR.
