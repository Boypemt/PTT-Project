/**
 * The handful of things a journey has to know about the customizer's shape.
 *
 * Only two: at phone width the two panels share a bottom sheet and one is
 * hidden, and a slider is driven with the keyboard. Everything else a spec
 * does through roles and accessible names, the way a visitor does.
 */
import { expect, type Locator, type Page } from '@playwright/test'
import { patternButtonName } from './catalog'
import { interpolate, type Lang, type Messages } from './ui'

type PanelId = 'patterns' | 'properties'

/**
 * Brings `panel` to the front, when there is a front to bring it to.
 *
 * From `md` up both panels are open and the switcher is display:none, which
 * takes it out of the accessibility tree — so a switcher that no role query
 * can find is the desktop layout, not a page that has not loaded. The caller
 * has already waited for the editor itself.
 */
export async function openPanel(
  page: Page,
  ui: Messages,
  panel: PanelId,
): Promise<void> {
  const tab = page
    .getByRole('group', { name: ui.customize.panelSwitcher })
    .getByRole('button', { name: ui.customize[panel], exact: true })

  if (await tab.isVisible()) await tab.click()
}

/** One pattern's button in the library. */
export function patternButton(page: Page, name: string): Locator {
  return page.getByRole('button', { name, exact: true })
}

/**
 * Puts one pattern on the product and waits until the library says so. A tile
 * or a leaf: the library marks whichever the selected layer is wearing.
 *
 * The editor is mostly invisible until something is on the cloth — the layer
 * list, the sliders and the leaf dyes all belong to a selected layer — so this
 * is the setup every spec that looks at the editor needs.
 */
export async function applyPattern(
  page: Page,
  ui: Messages,
  lang: Lang,
  patternId: string,
): Promise<void> {
  await openPanel(page, ui, 'patterns')

  const button = patternButton(
    page,
    patternButtonName(patternId, lang, ui.common.placeholderLabel),
  )
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}

/** The Konva stage: one canvas element, filling the editor's middle column. */
export function canvas(page: Page): Locator {
  return page.locator('canvas').first()
}

/**
 * Where a point in the mockup's own coordinates lands on screen.
 *
 * The app centres the mockup inside the canvas as large as it goes
 * (`fitContain` in src/lib/geometry.ts); this is that arithmetic again, from
 * the measured canvas, so a journey can put the mouse on a leaf without the
 * app having to expose anything for the test's benefit.
 */
export async function onMockup(
  page: Page,
  mockup: { width: number; height: number },
  point: { x: number; y: number },
): Promise<{ x: number; y: number }> {
  const box = await canvas(page).boundingBox()

  if (box === null) throw new Error('the canvas has no box to measure')

  const scale = Math.min(box.width / mockup.width, box.height / mockup.height)

  return {
    x: box.x + (box.width - mockup.width * scale) / 2 + point.x * scale,
    y: box.y + (box.height - mockup.height * scale) / 2 + point.y * scale,
  }
}

/** Drags from one screen point to another, slowly enough for Konva. */
export async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
}

/** A layer's own row in the layer list, which is where its name is written. */
export function layerRow(page: Page, ui: Messages, name: string): Locator {
  return page.getByRole('button', {
    name: interpolate(ui.customize.layers.select, { name }),
    exact: true,
  })
}

/**
 * Every layer row, whatever it is called — which is what a scatter needs,
 * since the leaves it throws are chosen at random. Matched on the part of
 * "Select {{name}}" that is the same for all of them.
 */
export function layerRows(page: Page, ui: Messages): Locator {
  const [prefix] = ui.customize.layers.select.split('{{name}}')
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return page.getByRole('button', { name: new RegExp(`^${escaped}`) })
}

/**
 * Walks a slider to `value` with the keyboard — Home, then one arrow per step.
 *
 * Not `fill()`: a range input takes no typing, and writing `value` from script
 * leaves React none the wiser, since it listens for the events a key press
 * sends. The reached value is checked against the step rather than for
 * equality, because the browser arrives at it by adding floats.
 */
export async function setSlider(slider: Locator, value: number): Promise<void> {
  const [min, step] = (
    await Promise.all(['min', 'step'].map((name) => slider.getAttribute(name)))
  ).map(Number)

  if (!Number.isFinite(min) || !(step > 0)) {
    throw new Error('setSlider needs an input[type=range] with min and step')
  }

  await slider.press('Home')

  const presses = Math.round((value - min) / step)
  for (let i = 0; i < presses; i += 1) await slider.press('ArrowRight')

  // A slider in the sheet's other panel would take the key presses nowhere,
  // and the journey would carry on against a value nobody asked for.
  const reached = Number(await slider.inputValue())
  expect(
    Math.abs(reached - value),
    `the slider stopped at ${String(reached)}, not ${String(value)}`,
  ).toBeLessThanOrEqual(step / 2)
}
