/**
 * Taking the design away: what "Done" does while the `export` flag is on.
 *
 * Against the flagged build, because the button does not exist in production
 * yet — see the header of `playwright.config.ts` for how that second build is
 * made. The journeys here move into `e2e/` when the feature graduates.
 *
 * What is worth checking is the round trip, not the arithmetic: the file is
 * really a PNG, it is named after the product and the day, and it comes out at
 * the size `exportGeometry` decided — which is the part a unit test cannot
 * reach, because between the formula and the file there is a Konva stage, a
 * crop, a pixel ratio and a base64 round trip, any of which could quietly
 * ignore it.
 *
 * And the pattern strip, measured again with the button on the page. The
 * production spec measures it without one; this is the same fixture against
 * the layout that actually has the thing that could have cost it a row.
 */
import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  mockupSize,
  patternButtonName,
  patternName,
  productName,
} from '../fixtures/catalog'
import {
  applyPattern,
  canvas,
  expectPatternNamesUnclipped,
  layerRow,
  openPanel,
  printAreaButton,
} from '../fixtures/editor'
import { messages } from '../fixtures/ui'

const th = messages.th

const PRODUCT = 'shawl-cotton'
const PATTERN = 'eco-print-scatter'

const HANDKERCHIEF = 'handkerchief'
const CORNER = 'corner'
const LEAF = 'teak'

/** `src/editor/stageExport.ts`, restated: the contract the file has to meet. */
const MAX_EXPORT_EDGE = 2000
const SCREEN_MULTIPLE = 2

/** The first eight bytes of every PNG. */
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

/** Today, as `src/lib/exportName.ts` writes it — the runner's own clock. */
function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${String(now.getFullYear())}${month}${day}`
}

/** A PNG's own idea of its size, read out of the IHDR chunk. */
function pngSize(file: Buffer): { width: number; height: number } {
  expect(
    file.subarray(0, 8).equals(PNG_SIGNATURE),
    'the downloaded file is not a PNG',
  ).toBe(true)

  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) }
}

/**
 * How large the mockup is on screen right now, along its longer edge.
 *
 * The app centres the mockup in the canvas as large as it goes; this is that
 * arithmetic again from the measured canvas, the way `onMockup` does it, so
 * the expected export size can be worked out at whichever width the project
 * is running at.
 */
async function mockupOnScreen(
  page: import('@playwright/test').Page,
  productId: string,
): Promise<number> {
  const mockup = mockupSize(productId)
  const box = await canvas(page).boundingBox()

  if (box === null) throw new Error('the canvas has no box to measure')

  const scale = Math.min(box.width / mockup.width, box.height / mockup.height)

  return Math.max(mockup.width, mockup.height) * scale
}

test('Done downloads the design as a PNG named after the product', async ({
  page,
}) => {
  await page.goto(`/customize/${PRODUCT}`)
  await expect(
    page.getByRole('heading', { level: 1, name: productName(PRODUCT, 'th') }),
  ).toBeVisible()

  await applyPattern(page, th, 'th', PATTERN)

  const onScreen = await mockupOnScreen(page, PRODUCT)
  const native = Math.max(...Object.values(mockupSize(PRODUCT)))
  const expected = Math.round(
    Math.min(Math.max(SCREEN_MULTIPLE * onScreen, native), MAX_EXPORT_EDGE),
  )

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: th.export.done, exact: true }).click(),
  ])

  expect(download.suggestedFilename()).toBe(
    `paton-phueng-${PRODUCT}-${today()}.png`,
  )

  const { width, height } = pngSize(await readFile(await download.path()))

  // Within a pixel: the canvas box is measured in CSS pixels and can be
  // fractional, and a PNG's size is a whole number of them.
  expect(Math.max(width, height)).toBeGreaterThanOrEqual(expected - 1)
  expect(Math.max(width, height)).toBeLessThanOrEqual(expected + 1)
  expect(Math.max(width, height)).toBeLessThanOrEqual(MAX_EXPORT_EDGE)
  // The design was drawn in 1000 units; it is never exported smaller than it
  // was drawn, however small the phone showing it.
  expect(Math.max(width, height)).toBeGreaterThanOrEqual(native)
  expect(width).toBe(height)
})

test('the design is exported without the editor on top of it', async ({
  page,
}) => {
  await page.goto(`/customize/${HANDKERCHIEF}`)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: productName(HANDKERCHIEF, 'th'),
    }),
  ).toBeVisible()

  // A leaf laid in the corner arrives selected, so its handles are on the
  // stage, and the dashed print areas are turned on as well: the two things
  // that are notes to the visitor rather than part of the cloth.
  await printAreaButton(page, HANDKERCHIEF, CORNER, 'th').click()
  await applyPattern(page, th, 'th', LEAF)

  await expect(
    page.getByRole('button', {
      name: patternButtonName(LEAF, 'th', th.common.placeholderLabel),
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  // The print-area switch and the layer list are in the other panel, which at
  // phone width means behind the sheet's switcher rather than beside the
  // canvas — and a panel the sheet is not showing is `display: none`, so
  // nothing in it can be read by role from here on.
  await openPanel(page, th, 'properties')
  const showPrintAreas = page.getByLabel(th.customize.showPrintAreas)
  await showPrintAreas.check()

  const leaf = layerRow(page, th, patternName(LEAF, 'th'))
  await expect(leaf).toHaveAttribute('aria-pressed', 'true')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: th.export.done, exact: true }).click(),
  ])

  // What the picture holds is `visual.spec.ts`'s kind of question and is
  // answered by the dialog's baselines in the next task; what this one can
  // say is that the annotations went off and came back. A stage left with its
  // handles hidden is the failure that would otherwise ship silently.
  expect(await download.path()).not.toBe('')
  await expect(showPrintAreas).toBeChecked()
  await expect(leaf).toHaveAttribute('aria-pressed', 'true')
})

test('the pattern names stay on screen with the Done button on the page', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'the library is only a bottom strip at phone width')

  await page.goto(`/customize/${HANDKERCHIEF}`)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: productName(HANDKERCHIEF, 'th'),
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: th.export.done, exact: true }),
  ).toBeVisible()

  await printAreaButton(page, HANDKERCHIEF, CORNER, 'th').click()
  await expectPatternNamesUnclipped(page, th)

  await applyPattern(page, th, 'th', LEAF)
  await expectPatternNamesUnclipped(page, th)

  await page
    .getByRole('button', { name: th.customize.layers.add, exact: true })
    .click()
  await expect(page.getByText(th.customize.layers.tapAdds)).toBeVisible()
  await expectPatternNamesUnclipped(page, th)
})
