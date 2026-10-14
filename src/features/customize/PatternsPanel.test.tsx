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
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Pattern, PrintArea } from '@/catalog'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import { catalogFile, makePattern, makeProduct } from '@/test/catalogFixtures'
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

const seigaiha = makePattern({
  id: 'seigaiha',
  name: { th: 'ลายคลื่น', en: 'Seigaiha waves' },
  defaultColors: ['#4B2A4F', '#A98FAE'],
  tags: ['geometric', 'waves'],
})
const gingham = makePattern({
  id: 'gingham',
  name: { th: 'ลายตาราง', en: 'Gingham check' },
  tags: ['geometric', 'check'],
})
const teak = makePattern({
  id: 'teak',
  kind: 'motif',
  name: { th: 'ใบสัก', en: 'Teak leaf' },
  tags: ['leaf'],
  source: {
    type: 'community',
    credit: 'Pa Ton Phueng',
    license: 'CC0-1.0',
  },
})

const openProduct = (
  printAreas: PrintArea[],
  patterns: Pattern[] = [seigaiha, gingham, teak],
) => {
  const product = makeProduct({ id: 'shawl-cotton', printAreas })

  renderApp({
    route: `/customize/${product.id}`,
    files: {
      ...validCatalogFiles,
      'products.json': catalogFile([product]),
      'patterns.json': catalogFile(patterns),
    },
  })

  return product
}

/** Waits for the editor, which the catalog and a lazy chunk both gate. */
const findPanel = () =>
  screen.findByRole('region', { name: th.customize.patterns })

const chip = (name: string) => screen.getByRole('button', { name })

/**
 * A pattern's button. Its accessible name is everything written on it —
 * the name, and the placeholder badge when it carries one — so it is
 * matched from the start instead of in full.
 */
const named = (pattern: Pattern) => new RegExp(`^${pattern.name.th}`)

const addLayerButton = () =>
  screen.getByRole('button', { name: th.customize.layers.add })

const thumb = (pattern: Pattern) =>
  screen.getByRole('button', { name: named(pattern) })

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the print area selector', () => {
  it('offers one chip per area a pattern can go on', async () => {
    openProduct([cloth, band])
    const panel = await findPanel()

    expect(panel).toHaveTextContent(th.customize.printArea)
    expect(chip(cloth.name.th)).toBeInTheDocument()
    expect(chip(band.name.th)).toBeInTheDocument()
  })

  it('leaves out an area that only takes motifs, which cannot be placed yet', async () => {
    openProduct([cloth, corner, band])
    await findPanel()

    expect(screen.queryByRole('button', { name: corner.name.th })).toBeNull()
  })

  it('says nothing at all when the choice is between one area and itself', async () => {
    openProduct([cloth, corner])
    const panel = await findPanel()

    expect(panel).not.toHaveTextContent(th.customize.printArea)
    expect(screen.queryByRole('button', { name: cloth.name.th })).toBeNull()
  })

  it('starts on the first area a pattern can go on', async () => {
    openProduct([cloth, band])
    await findPanel()

    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'true')
    expect(chip(band.name.th)).toHaveAttribute('aria-pressed', 'false')
  })

  it('moves the target to the area the visitor picks', async () => {
    const user = userEvent.setup()
    openProduct([cloth, band])
    await findPanel()

    await user.click(chip(band.name.th))

    expect(chip(band.name.th)).toHaveAttribute('aria-pressed', 'true')
    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'false')
    expect(editorStore.getState().selectedPrintAreaId).toBe(band.id)
  })

  it('points at a usable area even when the product opens on a motif one', async () => {
    openProduct([corner, cloth, band])
    await findPanel()

    // The store selects the product's first area; the library cannot offer
    // that one, so the chips — and the next pattern — point at the cloth.
    expect(editorStore.getState().selectedPrintAreaId).toBe(corner.id)
    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('the pattern library', () => {
  it('offers the tiles the print area allows, and no motif yet', async () => {
    openProduct([cloth])
    await findPanel()

    expect(thumb(seigaiha)).toBeInTheDocument()
    expect(thumb(gingham)).toBeInTheDocument()
    // The cloth takes motifs, but the editor cannot place one until task 09.
    expect(screen.queryByRole('button', { name: named(teak) })).toBeNull()
  })

  it('lists the motif kind as coming soon rather than pretending it is there', async () => {
    openProduct([cloth])
    const panel = await findPanel()
    const motif = within(panel).getByRole('button', {
      name: new RegExp(th.customize.kinds.motif),
    })

    expect(motif).toBeDisabled()
    expect(motif).toHaveTextContent(th.customize.comingSoon)
  })

  it('says nothing about kinds where the area takes only one', async () => {
    // The shirt's sleeves take tiles alone: a chip with no alternative is noise.
    openProduct([band])
    const panel = await findPanel()

    expect(
      within(panel).queryByRole('button', {
        name: new RegExp(th.customize.kinds.motif),
      }),
    ).toBeNull()
  })

  it('narrows the grid to what the visitor typed', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.type(screen.getByRole('searchbox'), 'ตาราง')

    expect(thumb(gingham)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: named(seigaiha) })).toBeNull()
  })

  it('says so when a search matches nothing', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    const panel = await findPanel()

    await user.type(screen.getByRole('searchbox'), 'ไม่มีลายนี้')

    expect(panel).toHaveTextContent(th.customize.noPatterns)
  })

  it('marks a placeholder pattern and leaves a real one unmarked', async () => {
    openProduct([cloth], [seigaiha, { ...teak, kind: 'tile' }])
    await findPanel()

    expect(thumb(seigaiha)).toHaveTextContent(th.common.placeholderLabel)
    expect(thumb(teak)).not.toHaveTextContent(th.common.placeholderLabel)
  })

  it('puts the pattern on the cloth in its own colours, and selects it', async () => {
    const user = userEvent.setup()
    openProduct([cloth, band])
    await findPanel()

    await user.click(thumb(seigaiha))

    const { design, selectedLayerId } = editorStore.getState()
    expect(design.layers).toHaveLength(1)
    expect(design.layers[0]).toMatchObject({
      type: 'tile',
      patternId: seigaiha.id,
      printAreaId: cloth.id,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      colors: seigaiha.defaultColors,
    })
    expect(selectedLayerId).toBe(design.layers[0].id)
  })

  it('puts it on the print area the chips point at', async () => {
    const user = userEvent.setup()
    openProduct([cloth, band])
    await findPanel()

    await user.click(chip(band.name.th))
    await user.click(thumb(seigaiha))

    expect(editorStore.getState().design.layers[0]).toMatchObject({
      printAreaId: band.id,
    })
  })

  it('does not hand the layer the catalog own colour array', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))
    const layer = editorStore.getState().design.layers[0]
    layer.colors.push('#000000')

    await user.click(addLayerButton())

    expect(editorStore.getState().design.layers[1].colors).toEqual(
      seigaiha.defaultColors,
    )
  })
})

describe('tapping a pattern with a layer selected', () => {
  it('changes the selected layer rather than stacking another one', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))
    await user.click(thumb(gingham))

    const { design } = editorStore.getState()
    expect(design.layers).toHaveLength(1)
    expect(design.layers[0]).toMatchObject({
      patternId: gingham.id,
      colors: gingham.defaultColors,
    })
  })

  it('keeps the work done on the layer and takes the new pattern colours', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))
    const { design, updateLayer } = editorStore.getState()
    updateLayer(design.layers[0].id, {
      scale: 1.6,
      rotation: 45,
      offsetX: 80,
      offsetY: -20,
      opacity: 0.5,
    })

    await user.click(thumb(gingham))

    expect(editorStore.getState().design.layers[0]).toMatchObject({
      patternId: gingham.id,
      scale: 1.6,
      rotation: 45,
      offsetX: 80,
      offsetY: -20,
      opacity: 0.5,
      colors: gingham.defaultColors,
    })
  })

  it('starts a layer instead when the selection prints on another area', async () => {
    const user = userEvent.setup()
    openProduct([cloth, band])
    await findPanel()

    await user.click(thumb(seigaiha))
    await user.click(chip(band.name.th))
    await user.click(thumb(gingham))

    expect(
      editorStore.getState().design.layers.map((layer) => layer.printAreaId),
    ).toEqual([cloth.id, band.id])
  })

  it('stacks a new layer when asked for one outright', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))
    await user.click(
      screen.getByRole('button', { name: th.customize.layers.add }),
    )
    await user.click(thumb(gingham))

    expect(
      editorStore.getState().design.layers.map((layer) => layer.patternId),
    ).toEqual([seigaiha.id, gingham.id])
  })

  it('offers nothing to add before a layer is there to add beside', async () => {
    openProduct([cloth])
    await findPanel()

    expect(
      screen.queryByRole('button', { name: th.customize.layers.add }),
    ).toBeNull()
  })

  it('marks the pattern the selected layer is wearing', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))

    expect(thumb(seigaiha)).toHaveAttribute('aria-pressed', 'true')
    expect(thumb(gingham)).toHaveAttribute('aria-pressed', 'false')
  })
})
