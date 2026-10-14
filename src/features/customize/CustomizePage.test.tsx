/**
 * The editor page from a visitor's side: does it open the product the URL
 * names, does picking a base colour change what is on the cloth, does the
 * bottom sheet switch panels, and what happens to a link with a bad id.
 *
 * The store is a module singleton the whole app shares, so each test starts
 * from `reset()` rather than inheriting the last one's design.
 *
 * What the canvas paints is not checked here: react-konva is stubbed in
 * `src/test/setup.ts` because jsdom has no 2D context. The pick's effect on
 * the picture is covered by the store assertion below plus the canvas's own
 * pure helpers, and by Playwright from task 14.
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import { catalogFile, makeProduct } from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const PAPER = '#F3EADA'
const MANGO = '#6B8E3D'

const product = makeProduct({
  id: 'shawl-cotton',
  baseColors: [PAPER, MANGO],
  price: { min: 259, currency: 'THB' },
})

const files = {
  ...validCatalogFiles,
  'products.json': catalogFile([product]),
}

const openEditor = (route = `/customize/${product.id}`) =>
  renderApp({ route, files })

const swatchName = (color: string) =>
  th.customize.baseColorOption.replace('{{color}}', color)

const swatch = (color: string) =>
  screen.getByRole('button', { name: swatchName(color) })

/** For the first look at the page, while the catalog is still loading. */
const findSwatch = (color: string) =>
  screen.findByRole('button', { name: swatchName(color) })

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the editor page', () => {
  it('opens the product the URL names', async () => {
    openEditor()

    expect(
      await screen.findByRole('heading', { level: 1, name: product.name.th }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: th.customize.back }),
    ).toHaveAttribute('href', '/products')
  })

  it('names the product and its price in the properties panel', async () => {
    openEditor()

    const properties = await screen.findByRole('region', {
      name: th.customize.properties,
    })

    expect(properties).toHaveTextContent(product.name.th)
    expect(properties).toHaveTextContent('฿259')
  })

  it('starts on the first base colour the product lists', async () => {
    openEditor()

    expect(await findSwatch(PAPER)).toHaveAttribute('aria-pressed', 'true')
    expect(swatch(MANGO)).toHaveAttribute('aria-pressed', 'false')
    expect(editorStore.getState().design.baseColor).toBe(PAPER)
  })

  it('moves the cloth to a base colour the visitor picks', async () => {
    const user = userEvent.setup()
    openEditor()

    await user.click(await findSwatch(MANGO))

    expect(swatch(MANGO)).toHaveAttribute('aria-pressed', 'true')
    expect(swatch(PAPER)).toHaveAttribute('aria-pressed', 'false')
  })

  it('records the pick in the design a share link would carry', async () => {
    const user = userEvent.setup()
    openEditor()

    await user.click(await findSwatch(MANGO))

    expect(editorStore.getState().design).toEqual({
      version: 1,
      productId: product.id,
      baseColor: MANGO,
      layers: [],
    })
  })

  it('selects the first print area of the product', async () => {
    openEditor()
    await findSwatch(PAPER)

    expect(editorStore.getState().selectedPrintAreaId).toBe(
      product.printAreas[0].id,
    )
  })

  it('asks the canvas for print-area outlines, off to begin with', async () => {
    const user = userEvent.setup()
    openEditor()

    const toggle = await screen.findByRole('checkbox', {
      name: th.customize.showPrintAreas,
    })
    expect(toggle).not.toBeChecked()
    expect(editorStore.getState().showPrintAreas).toBe(false)

    await user.click(toggle)

    expect(toggle).toBeChecked()
    expect(editorStore.getState().showPrintAreas).toBe(true)
  })

  it('shows one panel at a time in the bottom sheet', async () => {
    const user = userEvent.setup()
    openEditor()

    const patterns = await screen.findByRole('region', {
      name: th.customize.patterns,
    })
    const properties = screen.getByRole('region', {
      name: th.customize.properties,
    })

    // Both panels are in the DOM once; below `md` the switcher decides which
    // one the sheet shows, and from `md` up the classes show both.
    expect(patterns).not.toHaveClass('hidden')
    expect(properties).toHaveClass('hidden')

    await user.click(
      screen.getByRole('button', { name: th.customize.properties }),
    )

    expect(properties).not.toHaveClass('hidden')
    expect(patterns).toHaveClass('hidden')
  })
})

describe('an unknown product id', () => {
  it('says so and points back at the products', async () => {
    openEditor('/customize/no-such-product')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: th.customize.notFound.title,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: th.customize.notFound.back }),
    ).toHaveAttribute('href', '/products')
  })

  it('leaves the store alone', async () => {
    openEditor('/customize/no-such-product')
    await screen.findByRole('heading', { name: th.customize.notFound.title })

    expect(editorStore.getState().design.productId).toBe('')
  })
})
