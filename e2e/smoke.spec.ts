/**
 * The demo journey, start to finish: the path the team walks the community
 * through, and the one main must never break.
 *
 * Every assertion is on state the store can be seen through — the layer list,
 * which swatch is pressed, what a slider reads — rather than on pixels. What
 * the design *looks* like is `visual.spec.ts`'s job; this spec is about the
 * editor still agreeing with itself after eight steps.
 *
 * It runs in Thai, the language the site opens in, and switches to English at
 * the end: the design has to survive that, because the booth demo does it in
 * front of visitors.
 */
import { expect, test } from '@playwright/test'
import {
  baseColors,
  dyeSwatchName,
  patternButtonName,
  patternName,
  productName,
} from './fixtures/catalog'
import {
  applyTile,
  layerRow,
  openPanel,
  patternButton,
  setSlider,
} from './fixtures/editor'
import { interpolate, messages } from './fixtures/ui'

const PRODUCT = 'shawl-cotton'
const FIRST_PATTERN = 'eco-print-scatter'
const SECOND_PATTERN = 'polka'
/** ใบสัก / teak leaf in ชมพูเข้ม / deep pink: the community's strongest dye. */
const DYE = { leaf: 'teak', color: 'deep-pink' }
/** A second pattern printed over the first, not instead of it. */
const SECOND_OPACITY = 0.6

const th = messages.th
const en = messages.en

test('the demo journey: landing, a two-pattern shawl, then English', async ({
  page,
}) => {
  await page.goto('/')

  const heading = (name: string) =>
    page.getByRole('heading', { level: 1, name })

  // The site opens in Thai, and both languages read before anyone designs
  // anything: the landing page is what a visitor meets first in either.
  await expect(heading(th.home.title)).toBeVisible()
  await page.getByRole('button', { name: th.language.en, exact: true }).click()
  await expect(heading(en.home.title)).toBeVisible()
  await page.getByRole('button', { name: th.language.th, exact: true }).click()
  await expect(heading(th.home.title)).toBeVisible()

  await page.getByRole('link', { name: th.home.cta, exact: true }).click()
  await expect(page).toHaveURL(/\/products$/)
  await expect(heading(th.products.title)).toBeVisible()

  const product = productName(PRODUCT, 'th')
  await page
    .getByRole('link', {
      name: interpolate(th.products.customizeProduct, { product }),
      exact: true,
    })
    .click()
  await expect(page).toHaveURL(new RegExp(`/customize/${PRODUCT}$`))
  // The editor arrives as its own chunk, so this is also the wait for it.
  await expect(heading(product)).toBeVisible()

  // The first pattern on the cloth.
  await applyTile(page, th, 'th', FIRST_PATTERN)

  await openPanel(page, th, 'properties')
  await expect(
    layerRow(page, th, patternName(FIRST_PATTERN, 'th')),
  ).toBeVisible()

  // Printed in a dye the community actually makes.
  const dye = page
    .getByRole('button', {
      name: dyeSwatchName(DYE.leaf, DYE.color, 'th'),
      exact: true,
    })
    // The same colour is offered once per colour slot; the first is the main one.
    .first()
  await dye.click()
  await expect(dye).toHaveAttribute('aria-pressed', 'true')

  // On a different cloth.
  const cloth = baseColors(PRODUCT)[1]
  const clothSwatch = page.getByRole('button', {
    name: interpolate(th.customize.baseColorOption, { color: cloth }),
    exact: true,
  })
  await clothSwatch.click()
  await expect(clothSwatch).toHaveAttribute('aria-pressed', 'true')

  // A second pattern over the first rather than in place of it: letting the
  // selection go is what makes the next tap add a layer.
  await openPanel(page, th, 'patterns')
  await page
    .getByRole('button', { name: th.customize.layers.add, exact: true })
    .click()
  await patternButton(
    page,
    patternButtonName(SECOND_PATTERN, 'th', th.common.placeholderLabel),
  ).click()

  await openPanel(page, th, 'properties')
  await expect(
    layerRow(page, th, patternName(SECOND_PATTERN, 'th')),
  ).toBeVisible()
  await expect(
    layerRow(page, th, patternName(FIRST_PATTERN, 'th')),
  ).toBeVisible()

  await setSlider(
    page.getByLabel(th.customize.layer.opacity, { exact: true }),
    SECOND_OPACITY,
  )
  // Read back off the panel, which is the store's own arithmetic on screen.
  await expect(page.getByText('60%', { exact: true })).toBeVisible()

  // English, with the design intact: same two layers, same dye, same strength.
  await page.getByRole('button', { name: th.language.en, exact: true }).click()
  await expect(
    layerRow(page, en, patternName(FIRST_PATTERN, 'en')),
  ).toBeVisible()
  await expect(
    layerRow(page, en, patternName(SECOND_PATTERN, 'en')),
  ).toBeVisible()
  await expect(
    page
      .getByRole('button', {
        name: dyeSwatchName(DYE.leaf, DYE.color, 'en'),
        exact: true,
      })
      .first(),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('60%', { exact: true })).toBeVisible()
})
