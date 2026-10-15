/**
 * What a leaf on the cloth looks like, at both widths: the picture the motif
 * journeys next door cannot take, because the canvas is one bitmap and every
 * assertion they make is about the DOM around it.
 *
 * Two images, and the second is the one worth having: a selected leaf with its
 * transform handles on. Anchor sizes, the rotate handle's reach and whether a
 * thumb could land on any of them are all things only a picture shows — and on
 * the Pixel 7 baseline they are measurable against the leaf itself.
 *
 * Linux only and refreshed through the "Visual baselines" workflow, for the
 * reasons in e2e/visual.spec.ts. These sit in their own project directories
 * (`desktop-motifs`, `pixel-7-motifs`), so the production baselines never move
 * when a leaf does.
 */
import process from 'node:process'
import { expect, test } from '@playwright/test'
import { mockupSize, printAreaName, productName } from '../fixtures/catalog'
import { applyPattern, onMockup, openPanel } from '../fixtures/editor'
import { messages } from '../fixtures/ui'

const th = messages.th

const PRODUCT = 'handkerchief'
const AREA = 'corner'
const LEAF = 'teak'

/** The webfont every line break on the page depends on. */
const FONT = '1rem "IBM Plex Sans Thai"'

test.skip(
  process.platform !== 'linux',
  'screenshot baselines are made in the Linux container CI runs in',
)

test(
  'a leaf laid in the handkerchief corner',
  { tag: '@visual' },
  async ({ page }) => {
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
    await applyPattern(page, th, 'th', LEAF)

    // Text laid out in the fallback font wraps differently, which would read
    // as a layout regression. Better to fail saying the font never arrived.
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    expect(
      await page.evaluate((font) => document.fonts.check(font), FONT),
      'the IBM Plex Sans Thai webfont did not load',
    ).toBe(true)

    // The leaf arrives selected, so this is the leaf *and* its handles.
    await expect(page).toHaveScreenshot('motif-selected.png')

    // And again with nothing selected: the design as a visitor would show it.
    const empty = await onMockup(page, mockupSize(PRODUCT), { x: 260, y: 260 })
    await page.mouse.click(empty.x, empty.y)
    await expect(page).toHaveScreenshot('motif-on-cloth.png')
  },
)

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

    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    await expect(page).toHaveScreenshot('motif-plate.png')
  },
)
