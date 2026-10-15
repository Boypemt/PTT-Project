/**
 * Playwright's configuration: how the demo journeys are run.
 *
 * Everything runs against `vite preview` of a *production* build, because what
 * must never break is the demo as it is deployed — the dev server has
 * different chunking, different sourcemaps and no minifier. The build is part
 * of the `webServer` command rather than a step before it, so a stale `dist/`
 * can never be mistaken for the code under test.
 *
 * Two projects, chromium only: the 1280×800 desktop the team demos from and
 * the Pixel 7 the community will open the link on. Both come from Playwright's
 * own device registry (the Pixel one) or are spelled out here, and neither
 * names a browser channel — `channel: 'chrome'` would want Google Chrome
 * installed, while the chromium Playwright ships is what CI has.
 *
 * Screenshot baselines are Linux-only on purpose; see `e2e/visual.spec.ts`.
 */
import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/** Vite preview's own default port, kept explicit so `baseURL` can name it. */
const PORT = 4173

const HOST = '127.0.0.1'

const BASE_URL = `http://${HOST}:${PORT}`

const CI = process.env.CI !== undefined && process.env.CI !== ''

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
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
  ],
  webServer: {
    /* `--host` spelled out: left to itself vite preview binds `localhost`,
       which on Windows is ::1 alone — and the loopback name in `baseURL` has
       to mean the same interface on every machine the suite runs on. */
    command: `npm run build && npm run preview -- --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !CI,
    /* A cold Vite build on a CI runner takes its time. */
    timeout: 180_000,
  },
})
