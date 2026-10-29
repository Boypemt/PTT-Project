/**
 * The pattern names in the phone sheet, in every state the sheet has.
 *
 * The library's bottom strip is the tightest piece of layout in the app: the
 * canvas takes what the sheet leaves, so the sheet is exactly as tall as what
 * is inside it, and the pattern names sit on its last line. One more row above
 * the strip — a hint, a chip, a button — and the names go under the edge of the
 * screen while every other assertion in the suite carries on passing.
 *
 * Two products, because they stack differently. The shawl's whole cloth takes
 * both kinds of pattern, so it has the kind chips; the handkerchief's corner
 * takes leaves alone and has none, but it has the print-area chips the shawl
 * also has. And three states each, because what sits between the chips and the
 * strip changes as a visitor works: nothing at all before the first pattern,
 * the 44px "add a layer" button while one is selected, and the one-line hint
 * once the selection has been let go.
 *
 * Phone width only — from `md` up the library is a column with room to scroll,
 * and the strip is a grid.
 */
import { expect, test } from '@playwright/test'
import { productName } from './fixtures/catalog'
import {
  applyPattern,
  expectPatternNamesUnclipped,
  printAreaButton,
} from './fixtures/editor'
import { messages } from './fixtures/ui'

const th = messages.th

const SHAWL = 'shawl-cotton'
const SHAWL_PATTERN = 'eco-print-scatter'

const HANDKERCHIEF = 'handkerchief'
/** มุมขวาล่าง — the one area in the catalog that takes leaves and nothing else. */
const CORNER = 'corner'
const LEAF = 'teak'

test.skip(
  ({ isMobile }) => !isMobile,
  'the library is only a bottom strip at phone width',
)

/**
 * Walks one product through the three states and measures the names in each.
 *
 * The selection is let go with the library's own "add a layer" button rather
 * than by clicking bare cloth: it is the same `selectLayer(null)` either way,
 * and this one does not have to wait for a leaf to finish decoding before it
 * can be sure what it clicked.
 */
async function measureThroughTheStates(
  page: import('@playwright/test').Page,
  patternId: string,
): Promise<void> {
  // Nothing on the cloth yet: chips and the strip, and nothing between them.
  await expectPatternNamesUnclipped(page, th)

  await applyPattern(page, th, 'th', patternId)

  // A layer selected, so the sheet carries the "add a layer" button — the
  // tallest thing that ever sits between the chips and the strip.
  const addLayer = page.getByRole('button', {
    name: th.customize.layers.add,
    exact: true,
  })
  await expect(addLayer).toBeVisible()
  await expectPatternNamesUnclipped(page, th)

  // The selection let go, so the button is replaced by the hint that says the
  // next tap starts a layer instead of changing one.
  await addLayer.click()
  await expect(page.getByText(th.customize.layers.tapAdds)).toBeVisible()
  await expectPatternNamesUnclipped(page, th)
}

test('the shawl keeps its pattern names on screen', async ({ page }) => {
  await page.goto(`/customize/${SHAWL}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(SHAWL, 'th') }),
  ).toBeVisible()

  await measureThroughTheStates(page, SHAWL_PATTERN)
})

test('the handkerchief corner keeps its pattern names on screen', async ({
  page,
}) => {
  await page.goto(`/customize/${HANDKERCHIEF}`)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: productName(HANDKERCHIEF, 'th'),
    }),
  ).toBeVisible()

  await printAreaButton(page, HANDKERCHIEF, CORNER, 'th').click()

  await measureThroughTheStates(page, LEAF)
})
