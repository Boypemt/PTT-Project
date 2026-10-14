/**
 * The library panel from a visitor's side: which print areas are offered, and
 * what picking one does to the design the canvas draws.
 *
 * The products here are fixtures rather than the real catalog, so a change to
 * products.json cannot quietly make these pass or fail — but they are shaped
 * like the real thing: an area that takes tiles and motifs, one that takes
 * motifs only (the handkerchief's corner, the plate's centre), one tile-only
 * (the shirt's sleeves).
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import { catalogFile, makeProduct } from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const area = (
  id: string,
  nameEn: string,
  allowedKinds: PrintArea['allowedKinds'],
): PrintArea => ({
  id,
  name: { th: `TH ${nameEn}`, en: nameEn },
  clip: { type: 'rect', x: 0, y: 0, width: 400, height: 400 },
  allowedKinds,
})

const cloth = area('cloth', 'Whole cloth', ['tile', 'motif'])
const band = area('end-band', 'End band', ['tile'])
const corner = area('corner', 'Corner', ['motif'])

const openProduct = (...printAreas: PrintArea[]) => {
  const product = makeProduct({ id: 'shawl-cotton', printAreas })

  renderApp({
    route: `/customize/${product.id}`,
    files: { ...validCatalogFiles, 'products.json': catalogFile([product]) },
  })

  return product
}

/** Waits for the editor, which the catalog and a lazy chunk both gate. */
const findPanel = () =>
  screen.findByRole('region', { name: th.customize.patterns })

const chip = (name: string) => screen.getByRole('button', { name })

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the print area selector', () => {
  it('offers one chip per area a pattern can go on', async () => {
    openProduct(cloth, band)
    const panel = await findPanel()

    expect(panel).toHaveTextContent(th.customize.printArea)
    expect(chip(cloth.name.th)).toBeInTheDocument()
    expect(chip(band.name.th)).toBeInTheDocument()
  })

  it('leaves out an area that only takes motifs, which cannot be placed yet', async () => {
    openProduct(cloth, corner, band)
    await findPanel()

    expect(screen.queryByRole('button', { name: corner.name.th })).toBeNull()
  })

  it('says nothing at all when the choice is between one area and itself', async () => {
    openProduct(cloth, corner)
    const panel = await findPanel()

    expect(panel).not.toHaveTextContent(th.customize.printArea)
    expect(screen.queryByRole('button', { name: cloth.name.th })).toBeNull()
  })

  it('starts on the first area a pattern can go on', async () => {
    openProduct(cloth, band)
    await findPanel()

    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'true')
    expect(chip(band.name.th)).toHaveAttribute('aria-pressed', 'false')
  })

  it('moves the target to the area the visitor picks', async () => {
    const user = userEvent.setup()
    openProduct(cloth, band)
    await findPanel()

    await user.click(chip(band.name.th))

    expect(chip(band.name.th)).toHaveAttribute('aria-pressed', 'true')
    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'false')
    expect(editorStore.getState().selectedPrintAreaId).toBe(band.id)
  })

  it('points at a usable area even when the product opens on a motif one', async () => {
    openProduct(corner, cloth, band)
    await findPanel()

    // The store selects the product's first area; the library cannot offer
    // that one, so the chips — and the next pattern — point at the cloth.
    expect(editorStore.getState().selectedPrintAreaId).toBe(corner.id)
    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'true')
  })
})
