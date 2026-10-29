/**
 * The handful of things a journey has to know about the customizer's shape.
 *
 * Only two: at phone width the two panels share a bottom sheet and one is
 * hidden, and a slider is driven with the keyboard. Everything else a spec
 * does through roles and accessible names, the way a visitor does.
 */
import { expect, type Locator, type Page } from '@playwright/test'
import { patternButtonName, printAreaName } from './catalog'
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

/** The chip that aims the library at one part of the product. */
export function printAreaButton(
  page: Page,
  productId: string,
  areaId: string,
  lang: Lang,
): Locator {
  return page.getByRole('button', {
    name: printAreaName(productId, areaId, lang),
    exact: true,
  })
}

/** A locator's box, or a failure saying which element had none. */
async function boxOf(locator: Locator, what: string) {
  const box = await locator.boundingBox()

  if (box === null) throw new Error(`${what} has no box to measure`)

  return box
}

/**
 * Every pattern name the strip is showing, whole.
 *
 * On a phone the library is a sheet on the bottom edge sharing the screen with
 * the canvas, and the name is the last thing in each card — so it is the first
 * thing to go when anything above the strip grows by a row. A name half a line
 * short of being readable is invisible to every other assertion in the suite:
 * the button is still there, still has its accessible name, still takes a tap.
 * Only its box says what a visitor can actually read.
 *
 * So this measures. For each card the strip is showing in full — one mid-swipe
 * at the edge is cut off sideways on purpose, and skipped — the name's box has
 * to sit inside whichever edge would clip it: the sheet it scrolls in, or the
 * bottom of the screen when the sheet runs past it.
 *
 * Called from the production spec and again from the flagged one, because the
 * row this guards against is exactly what a new button in the editor header
 * would cost.
 */
export async function expectPatternNamesUnclipped(
  page: Page,
  ui: Messages,
): Promise<void> {
  await openPanel(page, ui, 'patterns')

  const panel = page.getByRole('region', { name: ui.customize.patterns })
  const sheet = await boxOf(panel, 'the pattern sheet')
  const viewport = page.viewportSize()

  if (viewport === null) throw new Error('the page reports no viewport size')

  // The two edges that can cut a name off: the sheet scrolls inside itself, and
  // the sheet itself can be taller than what is left of the screen.
  const ceiling = Math.max(sheet.y, 0)
  const floor = Math.min(sheet.y + sheet.height, viewport.height)

  // The library's own list — the print-area chips and the kind chips are
  // `ul > li > button` too, but their buttons take their name from their text,
  // so only a pattern card carries an `aria-label`. A selector that drifted
  // onto the chips would match nothing here rather than pass on the wrong row.
  const cards = panel.locator(':scope > ul > li > button[aria-label]')
  const count = await cards.count()

  expect(
    count,
    'the pattern strip is showing no patterns to measure',
  ).toBeGreaterThan(0)

  let measured = 0

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i)
    const cardBox = await boxOf(card, `pattern card ${String(i)}`)

    // Cut off sideways by the strip's own scrolling, which is what a strip is
    // for. Only a card the visitor can see whole has a name to read whole.
    if (
      cardBox.x < sheet.x - 0.5 ||
      cardBox.x + cardBox.width > sheet.x + sheet.width + 0.5
    ) {
      continue
    }

    const name = card.locator(':scope > span[aria-hidden="true"]').first()
    const text = (await name.textContent())?.trim() ?? ''
    const label = (await card.getAttribute('aria-label')) ?? ''

    // The card names itself for screen readers and prints the same name for
    // everyone else; if those two stop agreeing, this is measuring the wrong
    // element and should say so rather than quietly pass.
    expect(text, `pattern card ${String(i)} prints no name`).not.toBe('')
    expect(
      label,
      `the name in pattern card ${String(i)} is not the name it is labelled with`,
    ).toContain(text)

    const nameBox = await boxOf(name, `the name "${text}"`)

    expect(
      nameBox.y,
      `"${text}" is cut off at the top of the pattern sheet`,
    ).toBeGreaterThanOrEqual(ceiling - 0.5)
    expect(
      nameBox.y + nameBox.height,
      `"${text}" runs ${String(Math.round(nameBox.y + nameBox.height - floor))}px past the bottom of the pattern sheet`,
    ).toBeLessThanOrEqual(floor + 0.5)

    measured += 1
  }

  expect(
    measured,
    'every pattern card was mid-swipe, so no name was measured',
  ).toBeGreaterThan(0)
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
 * Waits until the canvas paints something it was not painting before.
 *
 * A pattern is in the store the moment the library is tapped, and the layer
 * list says so at once — but it only reaches the stage when its image has
 * decoded, which on a loaded machine is a good deal later. A click aimed at a
 * leaf that is not drawn yet lands on the cloth behind it instead, and a tap
 * on bare cloth lets the selection go: the journey then carries on pressing
 * keys at nothing.
 *
 * So any journey that puts something on the canvas and then points at it
 * waits here first. The canvas is one bitmap with nothing in the DOM to ask,
 * and nothing is exported from the app for a test's benefit, so what it has
 * painted is read the only way there is — by looking at it.
 */
export async function waitForPaint(page: Page, before: Buffer): Promise<void> {
  await expect(async () => {
    expect(
      (await canvas(page).screenshot()).equals(before),
      'the canvas is still painting what it was before',
    ).toBe(false)
  }).toPass()
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
