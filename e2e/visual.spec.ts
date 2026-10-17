/**
 * The pictures the suite keeps, at both widths: the editor with a tile printed
 * on the cloth, a leaf laid in a corner that takes nothing else, and the
 * designer's line art dyed on three products that each trim it differently.
 *
 * The journeys check that the editor still agrees with itself; these check
 * that it still *looks* like itself — a panel that has slipped behind the
 * canvas, a mockup that has stopped being drawn, a sheet that has grown over
 * the product are all things every assertion in `smoke.spec.ts` would pass
 * through without noticing. For a leaf there is more: where it actually lands,
 * how big its handles are and whether a thumb could hit one are things only a
 * picture shows.
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
import {
  dyeSwatchName,
  mockupSize,
  printAreaName,
  productName,
} from './fixtures/catalog'
import { applyPattern, onMockup, openPanel } from './fixtures/editor'
import { messages } from './fixtures/ui'

const th = messages.th

const PRODUCT = 'shawl-cotton'
const PATTERN = 'eco-print-scatter'

const HANDKERCHIEF = 'handkerchief'
const CORNER = 'corner'
const LEAF = 'teak'

/**
 * The designer's line art on three products that each show it differently:
 * tiled across a cream shawl in a dye the visitor picked, wrapped round the
 * mug in the colour the catalog lists it in, and trimmed to the plate's
 * circle. What no assertion can check is the thing that makes a mask a mask —
 * that the cloth shows between the lines rather than a white page.
 */
const MASK = 'celestial-star'
const MASK_DYE = { leaf: 'teak', color: 'deep-purple' }
const MUG = 'mug'
const MUG_MASK = 'hexaflow'
const PLATE = 'leaf-plate'
const PLATE_MASK = 'diamond-lattice'

/** The webfont every line break on the page depends on. */
const FONT = '1rem "IBM Plex Sans Thai"'

test.skip(
  process.platform !== 'linux',
  'screenshot baselines are made in the Linux container CI runs in',
)

/**
 * Waits for the font every baseline was photographed with. Text laid out in
 * the fallback font wraps differently, which would read as a layout
 * regression. Better to fail saying the font never arrived.
 */
async function waitForFont(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  expect(
    await page.evaluate((font) => document.fonts.check(font), FONT),
    'the IBM Plex Sans Thai webfont did not load',
  ).toBe(true)
}

test(
  'the editor with one tile on the cloth',
  { tag: '@visual' },
  async ({ page }) => {
    await page.goto(`/customize/${PRODUCT}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await applyPattern(page, th, 'th', PATTERN)

    await waitForFont(page)

    // Konva redraws once the pattern image is decoded; `toHaveScreenshot`
    // keeps shooting until two in a row match, which is that settling.
    await expect(page).toHaveScreenshot('editor-with-tile.png')
  },
)

test(
  'a leaf laid in the handkerchief corner',
  { tag: '@visual' },
  async ({ page }) => {
    await page.goto(`/customize/${HANDKERCHIEF}`)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: productName(HANDKERCHIEF, 'th'),
      }),
    ).toBeVisible()

    await openPanel(page, th, 'patterns')
    await page
      .getByRole('button', {
        name: printAreaName(HANDKERCHIEF, CORNER, 'th'),
        exact: true,
      })
      .click()
    await applyPattern(page, th, 'th', LEAF)

    await waitForFont(page)

    // The leaf arrives selected, so this is the leaf *and* its handles — the
    // anchor sizes and the rotate handle's reach, which on the Pixel 7
    // baseline are measurable against the leaf itself.
    await expect(page).toHaveScreenshot('motif-selected.png')

    // And again with nothing selected: the design as a visitor would show it.
    const empty = await onMockup(page, mockupSize(HANDKERCHIEF), {
      x: 260,
      y: 260,
    })
    await page.mouse.click(empty.x, empty.y)
    await expect(page).toHaveScreenshot('motif-on-cloth.png')
  },
)

test(
  'line art tiled across the shawl in a leaf dye',
  { tag: '@visual' },
  async ({ page }) => {
    await page.goto(`/customize/${PRODUCT}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await applyPattern(page, th, 'th', MASK)
    await openPanel(page, th, 'properties')
    await page
      .getByRole('button', {
        name: dyeSwatchName(MASK_DYE.leaf, MASK_DYE.color, 'th'),
        exact: true,
      })
      .click()

    await waitForFont(page)

    // The dye poured through the ink, and the cream of the cloth showing
    // between the lines — which is the whole of what the mask is for.
    await expect(page).toHaveScreenshot('mask-on-shawl.png')
  },
)

test('line art wrapped round the mug', { tag: '@visual' }, async ({ page }) => {
  await page.goto(`/customize/${MUG}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(MUG, 'th') }),
  ).toBeVisible()

  await applyPattern(page, th, 'th', MUG_MASK)
  await waitForFont(page)

  // In the colour the catalog lists it in, on the narrowest print area
  // there is: a repeat meant for a shawl has to still read at 260 units.
  await expect(page).toHaveScreenshot('mask-on-mug.png')
})

test('line art trimmed to the plate', { tag: '@visual' }, async ({ page }) => {
  await page.goto(`/customize/${PLATE}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(PLATE, 'th') }),
  ).toBeVisible()

  await applyPattern(page, th, 'th', PLATE_MASK)
  await waitForFont(page)

  // The one print area that is a path rather than a rectangle: the tile has
  // to stop at the plate's rim and nowhere else.
  await expect(page).toHaveScreenshot('mask-on-plate.png')
})

test(
  'a leaf in the middle of the plate',
  { tag: '@visual' },
  async ({ page }) => {
    const plate = 'leaf-plate'

    await page.goto(`/customize/${plate}`)
    await expect(
      page.getByRole('heading', { level: 1, name: productName(plate, 'th') }),
    ).toBeVisible()

    await openPanel(page, th, 'patterns')
    await page
      .getByRole('button', {
        name: printAreaName(plate, 'centre', 'th'),
        exact: true,
      })
      .click()
    await applyPattern(page, th, 'th', 'tong-tung')

    await waitForFont(page)
    await expect(page).toHaveScreenshot('motif-plate.png')
  },
)
