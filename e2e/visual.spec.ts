/**
 * The one picture the suite keeps: the editor with a tile printed on the
 * cloth, at both widths.
 *
 * The journeys check that the editor still agrees with itself; this checks
 * that it still *looks* like itself — a panel that has slipped behind the
 * canvas, a mockup that has stopped being drawn, a sheet that has grown over
 * the product are all things every assertion in `smoke.spec.ts` would pass
 * through without noticing.
 *
 * The baselines are made in the Linux container CI runs in, and nowhere else:
 * fonts, antialiasing and scrollbars differ enough between operating systems
 * that a Windows baseline would fail every CI run. So these tests only run on
 * Linux, and elsewhere they skip with that reason rather than quietly writing
 * a second set of images nobody reviews.
 *
 * To update them after an intentional UI change, either run the "Visual
 * baselines" workflow in GitHub Actions on your branch, or do the same thing
 * locally:
 *
 *   docker run --rm -v "$PWD:/work" -w /work --ipc=host \
 *     mcr.microsoft.com/playwright:v1.64.0-noble \
 *     bash -c "npm ci && npx playwright test --grep @visual --update-snapshots"
 *
 * (that overwrites node_modules with Linux builds, so run it on a copy of the
 * repo, or run `npm ci` again afterwards). Say so in the PR when a baseline
 * changes on purpose — a reviewer cannot tell the two apart from the diff.
 */
import process from 'node:process'
import { expect, test } from '@playwright/test'
import { applyTile } from './fixtures/editor'
import { messages } from './fixtures/ui'

const th = messages.th

const PRODUCT = 'shawl-cotton'
const PATTERN = 'eco-print-scatter'

/** The webfont every line break on the page depends on. */
const FONT = '1rem "IBM Plex Sans Thai"'

test.skip(
  process.platform !== 'linux',
  'screenshot baselines are made in the Linux container CI runs in',
)

test(
  'the editor with one tile on the cloth',
  { tag: '@visual' },
  async ({ page }) => {
    await page.goto(`/customize/${PRODUCT}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await applyTile(page, th, 'th', PATTERN)

    // Text laid out in the fallback font wraps differently, which would read
    // as a layout regression. Better to fail saying the font never arrived.
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    const loaded = await page.evaluate(
      (font) => document.fonts.check(font),
      FONT,
    )
    expect(loaded, 'the IBM Plex Sans Thai webfont did not load').toBe(true)

    // Konva redraws once the pattern image is decoded; `toHaveScreenshot`
    // keeps shooting until two in a row match, which is that settling.
    await expect(page).toHaveScreenshot('editor-with-tile.png')
  },
)
