/**
 * Playwright's configuration: how the demo journeys are run.
 *
 * Everything runs against `vite preview` of a *production* build, because what
 * must never break is the demo as it is deployed — the dev server has
 * different chunking, different sourcemaps and no minifier. The build is part
 * of the `webServer` command rather than a step before it, so a stale `dist/`
 * can never be mistaken for the code under test.
 *
 * Two widths, chromium only: the 1280×800 desktop the team demos from and the
 * Pixel 7 the community will open the link on. Both come from Playwright's own
 * device registry (the Pixel one) or are spelled out here, and neither names a
 * browser channel — `channel: 'chrome'` would want Google Chrome installed,
 * while the chromium Playwright ships is what CI has.
 *
 * And two builds, which is where feature flags come in. `VITE_FLAGS` is read
 * at build time and baked into the bundle (see `src/lib/flags.ts`), so one
 * server cannot show the site in both states: there is a plain build, which is
 * production and what every spec outside `e2e/motifs/` runs against, and a
 * flagged build on its own port that the motif journeys run against. Both are
 * served, so one run covers what a visitor meets today and what the team can
 * try on a preview link — and a flag that leaked into production would fail
 * the first group rather than be noticed later.
 *
 * That makes four projects: each width against each build.
 *
 * Screenshot baselines are Linux-only on purpose; see `e2e/visual.spec.ts`.
 * Each project keeps its own, so the flagged builds photograph into
 * directories of their own and the production baselines never move.
 */
import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/** Vite preview's own default port, kept explicit so `baseURL` can name it. */
const PORT = 4173

/** The flagged build's port. Anything free and next door. */
const FLAGGED_PORT = 4174

const HOST = '127.0.0.1'

const url = (port: number) => `http://${HOST}:${port}`

const BASE_URL = url(PORT)

/** The flags the second build is made with: the ones in review right now. */
const PREVIEW_FLAGS = 'motifs'

/** Its own `dist`, so the two builds cannot overwrite each other. */
const FLAGGED_DIST = 'dist-motifs'

/** The journeys that need the flagged build, by their folder under `e2e/`. */
const FLAGGED_SPECS = 'motifs/**'

const CI = process.env.CI !== undefined && process.env.CI !== ''

const preview = (port: number) => `--host ${HOST} --port ${port} --strictPort`

/**
 * The flagged build skips `tsc -b`, which `npm run build` does first: the two
 * builds run side by side and would race over the same `.tsbuildinfo`. Nothing
 * is lost — the types in this build are the types in the other one, which is
 * checked here and again by the `typecheck` job.
 */
const FLAGGED_SERVER = `npx vite build --outDir ${FLAGGED_DIST} && npx vite preview --outDir ${FLAGGED_DIST} ${preview(FLAGGED_PORT)}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  /* `test.only` left in a spec would quietly shrink the suite that guards main. */
  forbidOnly: CI,
  /* One retry in CI: a journey that passes on the second run is still a pass,
     but a flake is visible in the report rather than hidden by three retries. */
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], CI ? ['github'] : ['list']],
  /* One baseline per project, named by the spec's own argument. No
     `{platform}`: the baselines are made in the Linux container CI runs in, so
     a run on another OS must compare against those and fail loudly rather than
     write a second set nobody reviews. */
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    /* Kept for the first failure of a test, which is what gets opened. */
    trace: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      /* Font antialiasing moves a few pixels by a shade or two between runs of
         the same image. `threshold` forgives that per pixel; the ratio leaves
         room for a handful of them without forgiving a moved element. */
      threshold: 0.25,
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: FLAGGED_SPECS,
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'pixel-7',
      testIgnore: FLAGGED_SPECS,
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'desktop-motifs',
      testMatch: FLAGGED_SPECS,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
        baseURL: url(FLAGGED_PORT),
      },
    },
    {
      name: 'pixel-7-motifs',
      testMatch: FLAGGED_SPECS,
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        baseURL: url(FLAGGED_PORT),
      },
    },
  ],
  webServer: [
    {
      /* `--host` spelled out: left to itself vite preview binds `localhost`,
         which on Windows is ::1 alone — and the loopback name in `baseURL` has
         to mean the same interface on every machine the suite runs on. */
      command: `npm run build && npm run preview -- ${preview(PORT)}`,
      url: BASE_URL,
      reuseExistingServer: !CI,
      /* A cold Vite build on a CI runner takes its time. */
      timeout: 180_000,
    },
    {
      command: FLAGGED_SERVER,
      url: url(FLAGGED_PORT),
      env: { VITE_FLAGS: PREVIEW_FLAGS },
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  ],
})
