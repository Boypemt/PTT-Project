# Contributing

Working rules in full: [`CLAUDE.md`](../CLAUDE.md). Context and domain model:
[`PROJECT_BRIEF.md`](PROJECT_BRIEF.md). What gets built next:
[`ROADMAP.md`](ROADMAP.md).

## Setup

Node 24+ (`.nvmrc`), then `npm install`. That also installs the Git hooks.

## Branches

Never commit to `main`. One task = one branch, named by what it does:

| Prefix | For |
| --- | --- |
| `feat/` | new behaviour |
| `fix/` | a bug |
| `chore/` | tooling, deps, config |
| `docs/` | documentation only |
| `test/` | tests only |

Branch from the latest `main`: `git switch main && git pull && git switch -c feat/pattern-panel`.

Before pushing, check the branch's PR state with `gh pr view`; never push to a
branch whose PR is merged or closed — create a new branch from main instead.
One branch = one PR.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), checked by
commitlint on `commit-msg`:

```
feat(editor): add pattern scale slider
```

Scopes: `app`, `catalog`, `editor`, `ui`, `i18n`, `export`, `ci`, `deps`, `docs`.

Keep commits **atomic** — one logical change each, and the project builds and
passes tests at every commit. Don't mix reformatting with a feature, and don't
dump a whole task into one commit at the end.

On commit, lint-staged runs `eslint --fix` and Prettier over staged files.

## Before you push

```bash
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

CI runs the same steps on every PR, so a failure here is a failure there.

## Pull requests

1. Push the branch and open a PR with `gh pr create` — fill in the template
   (Summary / Changes / How to test / Screenshots / Checklist).
2. Keep it reviewable: aim for ≤ ~400 lines of hand-written code. If a task
   grows past that, split it into two PRs.
3. Wait for green CI and check the Vercel preview, including at phone width.
4. The repo owner merges. Keep the small commits — no squash-merge.
