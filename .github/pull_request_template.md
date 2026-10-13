## Summary

<!-- What this PR does and why, in two or three sentences. Link the task prompt
     in docs/prompts/ or the roadmap row it comes from. -->

## Changes

<!-- The commits in order, one line each: what changed and where. -->

## How to test

<!-- Steps a reviewer can follow locally, e.g.
     1. npm ci
     2. npm run dev
     3. Open http://localhost:5173 and … -->

## Screenshots

<!-- Desktop and phone width for anything visible. Delete if nothing changed
     on screen. -->

## Checklist

- [ ] `npm run lint && npm run typecheck && npm test -- --run && npm run build` pass
- [ ] Commits are atomic and follow Conventional Commits
- [ ] New logic in `src/lib` has unit tests
- [ ] New user-visible text has keys in both `th.json` and `en.json`
- [ ] No product or pattern is hardcoded in a component (catalog is data)
- [ ] Tried it at phone width; touch targets ≥ 44px
- [ ] Any third-party asset is public-domain/CC0 and listed in `docs/CREDITS.md`
