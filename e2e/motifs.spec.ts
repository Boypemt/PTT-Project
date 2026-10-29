/**
 * Laying leaves on the cloth.
 *
 * The canvas is one bitmap, so there is nothing in the DOM to ask where a leaf
 * is — and nothing is exported from the app for a test's benefit. So these
 * check what a visitor can see: the layer list, which panel line the
 * properties shows, and whether what the canvas paints changed at all. Where
 * the leaf actually ends up is the visual baselines' job, in `visual.spec.ts`.
 *
 * The handkerchief is the product throughout, because its corner takes motifs
 * and nothing else — the area the editor could not serve at all until motifs
 * graduated from their flag.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import {
  mockupSize,
  patternName,
  printAreaCenter,
  printAreaName,
  productName,
} from './fixtures/catalog'
import {
  applyPattern,
  canvas,
  drag,
  layerRow,
  layerRows,
  onMockup,
  openPanel,
  waitForPaint,
} from './fixtures/editor'
import { messages } from './fixtures/ui'

const th = messages.th

const PRODUCT = 'handkerchief'
/** Motifs only, so it exists in the editor only with the flag on. */
const AREA = 'corner'
const LEAF = 'teak'
const TILE = 'gingham'

/** WCAG 2.1 A and AA, as in a11y.spec.ts. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const BLOCKING = ['serious', 'critical']

/** Opens the editor and puts one leaf in the motif-only corner. */
async function layLeaf(page: import('@playwright/test').Page) {
  await page.goto(`/customize/${PRODUCT}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(PRODUCT, 'th') }),
  ).toBeVisible()

  await openPanel(page, th, 'patterns')
  await page
    .getByRole('button', {
      name: printAreaName(PRODUCT, AREA, 'th'),
      exact: true,
    })
    .click()

  const bare = await canvas(page).screenshot()
  await applyPattern(page, th, 'th', LEAF)

  // Not until the leaf is actually drawn: every journey below points at where
  // it lies, and a click that arrives first reaches the cloth instead and
  // lets go of the selection it was about to use.
  await waitForPaint(page, bare)
}

/** The point on screen the leaf was laid at: the middle of its print area. */
const leafAt = (page: import('@playwright/test').Page) =>
  onMockup(page, mockupSize(PRODUCT), printAreaCenter(PRODUCT, AREA))

test('the corner takes a leaf, and says which', async ({ page }) => {
  await layLeaf(page)

  await openPanel(page, th, 'properties')
  await expect(layerRow(page, th, patternName(LEAF, 'th'))).toBeVisible()
  // The leaf's own panel, not the tile one: it has no offset sliders.
  await expect(
    page.getByRole('slider', { name: th.customize.layer.scale }),
  ).toBeVisible()
  await expect(
    page.getByRole('slider', { name: th.customize.layer.offsetX }),
  ).toHaveCount(0)
})

test('a tap on the empty cloth lets the leaf go', async ({ page }) => {
  await layLeaf(page)
  await openPanel(page, th, 'properties')
  await expect(
    page.getByRole('button', { name: th.customize.layer.duplicate }),
  ).toBeVisible()

  // The top-left of the mockup is cloth with nothing on it: every node but a
  // motif is deaf, so this tap reaches the stage itself.
  const empty = await onMockup(page, mockupSize(PRODUCT), { x: 260, y: 260 })
  await page.mouse.click(empty.x, empty.y)

  await expect(page.getByText(th.customize.layer.none)).toBeVisible()
  // Let go of, not thrown away.
  await expect(layerRow(page, th, patternName(LEAF, 'th'))).toBeVisible()
})

test('the leaf follows a drag', async ({ page }) => {
  await layLeaf(page)

  // Deselected first, so the drag starts on the leaf rather than on one of the
  // transform handles sitting over it.
  const empty = await onMockup(page, mockupSize(PRODUCT), { x: 260, y: 260 })
  await page.mouse.click(empty.x, empty.y)

  const before = await canvas(page).screenshot()
  const from = await leafAt(page)
  await drag(page, from, { x: from.x - 40, y: from.y - 40 })

  await expect(async () => {
    const after = await canvas(page).screenshot()
    expect(after.equals(before)).toBe(false)
  }).toPass()

  // And it is the same single leaf that moved.
  await openPanel(page, th, 'properties')
  await expect(layerRow(page, th, patternName(LEAF, 'th'))).toHaveCount(1)
})

test('a tile is not dragged off its area', async ({ page }) => {
  await page.goto(`/customize/${PRODUCT}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(PRODUCT, 'th') }),
  ).toBeVisible()
  await applyPattern(page, th, 'th', TILE)

  await openPanel(page, th, 'properties')
  await expect(page.getByText(th.customize.layer.scale)).toBeVisible()

  // Dragging across the cloth the tile prints on. A tile has no place of its
  // own to move, so the drag reaches the stage — which lets the selection go,
  // and that is the proof the tile never took hold of the pointer.
  const from = await onMockup(page, mockupSize(PRODUCT), { x: 300, y: 300 })
  await drag(page, from, { x: from.x + 90, y: from.y + 60 })

  await openPanel(page, th, 'properties')
  await expect(page.getByText(th.customize.layer.none)).toBeVisible()
  await expect(layerRow(page, th, patternName(TILE, 'th'))).toBeVisible()
})

test('one tap throws a handful of leaves across the cloth', async ({
  page,
}) => {
  await page.goto(`/customize/${PRODUCT}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(PRODUCT, 'th') }),
  ).toBeVisible()

  await openPanel(page, th, 'patterns')
  const before = await canvas(page).screenshot()
  await page
    .getByRole('button', { name: th.customize.layers.scatter, exact: true })
    .click()

  await openPanel(page, th, 'properties')
  const thrown = await layerRows(page, th).count()
  expect(thrown).toBeGreaterThanOrEqual(5)
  expect(thrown).toBeLessThanOrEqual(8)

  // And they are on the cloth, not only in the list.
  await expect(async () => {
    const after = await canvas(page).screenshot()
    expect(after.equals(before)).toBe(false)
  }).toPass()
})

test('the keyboard copies and deletes the leaf the canvas holds', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile === true, 'the keyboard shortcuts are a desktop journey')

  await layLeaf(page)

  // Clicking the leaf both selects it and puts the focus on the canvas, which
  // is the only place these keys do anything.
  const leaf = await leafAt(page)
  await page.mouse.click(leaf.x, leaf.y)

  await page.keyboard.press('Control+d')
  await openPanel(page, th, 'properties')
  await expect(layerRows(page, th)).toHaveCount(2)

  await page.mouse.click(leaf.x, leaf.y)
  await page.keyboard.press('Delete')
  await expect(layerRows(page, th)).toHaveCount(1)
})

test('no serious accessibility violations with a leaf selected', async ({
  page,
}) => {
  await layLeaf(page)
  await openPanel(page, th, 'properties')

  const { violations } = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .analyze()

  expect(
    violations
      .filter((violation) => BLOCKING.includes(violation.impact ?? ''))
      .map((violation) => ({
        rule: violation.id,
        elements: violation.nodes.map((node) => node.target.join(' ')),
      })),
  ).toEqual([])
})
