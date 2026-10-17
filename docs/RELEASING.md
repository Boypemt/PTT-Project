# Releasing

Working rules: [`CLAUDE.md`](../CLAUDE.md). What is built next:
[`ROADMAP.md`](ROADMAP.md). What each release contained:
[`CHANGELOG.md`](../CHANGELOG.md).

Nothing is sold through this prototype, so "released" means one thing: the link
the community and the team open in front of other people keeps working. That
link is served from the `release` branch, and `release` only ever moves to a
commit of `main` that has been tagged.

| Branch | What it is | Where Vercel puts it |
| --- | --- | --- |
| feature branch | one task, one PR | a Preview deployment per push |
| `main` | always deployable; every PR lands here | a Preview deployment |
| `release` | what the demo link serves | Production |

`main` is kept deployable by the CI gate (`Lint, typecheck, test, build` and
`E2E (Playwright, chromium)`) and by feature flags: unfinished work goes in
switched off rather than waiting on a branch.

## One-time setup

Not done yet — the demo link currently follows `main`. Before the first
promotion:

1. Create the branch from the commit that is being released:
   `git switch main && git pull && git switch -c release && git push -u origin release`
2. Vercel → the project → **Settings → Git → Production Branch** → `release`.
   From then on `main` deploys to Preview like any other branch.
3. Vercel → **Settings → Environment Variables** → add `VITE_FLAGS`, scoped to
   **Preview** only (see [Feature flags](#feature-flags)).
4. GitHub → **Settings → Branches** → protect `main` and `release`: require both
   CI checks, and no direct pushes to either.

## Promoting a release

1. Everything is merged into `main` and CI is green there.
2. Walk the demo journey by hand on `main`'s preview link, at phone width —
   the e2e suite checks that the editor agrees with itself, not that the demo
   feels right.
3. Write the release into [`CHANGELOG.md`](../CHANGELOG.md) (a PR like any
   other).
4. Tag the commit on `main` and push the tag:

   ```sh
   git switch main && git pull
   git tag -a v0.2.0 -m "M2: the working customizer"
   git push origin v0.2.0
   ```

5. Fast-forward `release` to that tag:

   ```sh
   git switch release && git pull
   git merge --ff-only v0.2.0
   git push origin release
   ```

   `--ff-only` on purpose. `release` is a pointer at a tested commit of `main`
   and nothing else; if the merge is refused, something was committed straight
   to `release` and that is the thing to look at, not an argument to drop.

6. Watch the Production deployment finish in Vercel, then open the demo link
   and check the version you expect is on it.

## Tagging

`vMAJOR.MINOR.PATCH`, annotated (`git tag -a`), on a commit of `main`.

- MAJOR stays `0` while this is a prototype.
- MINOR is a roadmap milestone: `v0.1.0-demo` is M1 + the customizer as first
  shown, `v0.2.0` would be M2 (the working customizer), `v0.3.0` M3.
- PATCH is a fix to something already promoted.

A tag is never moved or deleted once pushed: the whole point of promoting by
fast-forward is that "what is on the demo link" is a commit anyone can check
out months later.

## Rolling back

Vercel keeps every build, so the fastest fix is to serve the previous one
again — no rebuild, a few seconds.

1. Vercel → the project → **Deployments**.
2. Find the last Production deployment that was good.
3. Its **⋯** menu → **Instant Rollback** → confirm. (Vercel moves its UI about;
   the same thing from a terminal is `vercel rollback <deployment-url>` after
   `npx vercel login`.)

Then fix git, because a rollback changes what the domain serves and nothing
else — the next deployment would bring the bad build straight back:

```sh
git switch release && git pull
git reset --hard v0.1.0-demo        # the tag that was good
git push --force-with-lease origin release
```

and fix the problem on `main` in a normal PR. Add what broke to the CHANGELOG
under the next version, so the rollback is not something only the people in the
room remember.

## Feature flags

`VITE_FLAGS` is a comma-separated list read by
[`src/lib/flags.ts`](../src/lib/flags.ts) — `VITE_FLAGS=history,export`.

- **Preview** sets the flags of whatever is being worked on, so the team can
  try unfinished work on a real link.
- **Production** leaves them unset until the feature is complete. Removing the
  flag from the code is the last commit of that feature, not the first.

Vite replaces the variable at build time, so changing it on Vercel takes a
redeploy, not a reload. Locally, copy `.env.example` to `.env.local`.

### The flagged e2e build

Because the flags are baked in at build time, one server cannot show the site
in both states, so [`playwright.config.ts`](../playwright.config.ts) can make a
second one. `IN_PROGRESS_FLAGS` there is the list of flags that build is made
with, and everything follows from it:

| `IN_PROGRESS_FLAGS` | What the suite does |
| --- | --- |
| `[]` (now) | one build on 4173, the `desktop` and `pixel-7` projects, nothing else started |
| `['export']` | that build, plus one made with `VITE_FLAGS=export` on 4174 and the `desktop-flagged` / `pixel-7-flagged` projects against it |

So putting a feature behind a flag is two lines: add the flag to
`IN_PROGRESS_FLAGS`, and put the journeys that need it in `e2e/flagged/`.
Everything outside that folder keeps running against the plain build, which is
production — a flag that leaked out of its gate fails there rather than being
noticed on the demo link.

Graduating the feature is the same two lines in reverse, plus the move the
journeys deserve: out of `e2e/flagged/` into `e2e/`, where they run at both
widths against the build a visitor gets. Each project keeps its own baselines
(`e2e/__screenshots__/<project>/`), so a spec that moves takes its screenshots
with it — `git mv` them into the `desktop` and `pixel-7` directories rather
than letting the suite write a new set.

Note what else graduating does: the production baselines were photographed
with the feature off, so **every screenshot the feature touches now changes on
purpose**. Refresh them with the workflow below and say in the PR which images
moved and why.

## Updating the visual baselines

`e2e/__screenshots__/` holds one screenshot of the editor per width. They are
made in the Linux container CI runs in, so they cannot be regenerated on a
Windows or macOS machine directly.

When a UI change moves them **on purpose**:

1. GitHub → **Actions** → **Visual baselines** → **Run workflow** → pick your
   branch. It rewrites the screenshots and commits them to that branch.
2. Re-run CI on the branch afterwards: a push made with `GITHUB_TOKEN` starts no
   workflow run, so the PR will still be showing the old result.
3. Say in the PR body that the baseline changed and why. A reviewer cannot tell
   an intended change from a regression by looking at the diff.

With Docker to hand, the same thing locally (on a copy of the repo — it
replaces `node_modules` with Linux builds):

```sh
docker run --rm -v "$PWD:/work" -w /work --ipc=host \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  bash -c "npm ci && npx playwright test --grep @visual --update-snapshots"
```
