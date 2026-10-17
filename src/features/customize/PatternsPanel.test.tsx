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
import { motifPlacement } from '@/editor/motifPlacement'
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

/** Scoped to the library: the layer list names its rows after patterns too. */
const thumb = (pattern: Pattern) =>
  within(screen.getByRole('region', { name: th.customize.patterns })).getByRole(
    'button',
    { name: named(pattern) },
  )

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the print area selector', () => {
  it('offers one chip per print area', async () => {
    openProduct([cloth, band])
    const panel = await findPanel()

    expect(panel).toHaveTextContent(th.customize.printArea)
    expect(chip(cloth.name.th)).toBeInTheDocument()
    expect(chip(band.name.th)).toBeInTheDocument()
  })

  it('offers an area that takes leaves and nothing else', async () => {
    openProduct([cloth, corner, band])
    await findPanel()

    expect(chip(corner.name.th)).toBeInTheDocument()
  })

  it('says nothing at all when the choice is between one area and itself', async () => {
    openProduct([cloth])
    const panel = await findPanel()

    expect(panel).not.toHaveTextContent(th.customize.printArea)
    expect(screen.queryByRole('button', { name: cloth.name.th })).toBeNull()
  })

  it('starts on the product own first area, whichever kinds it takes', async () => {
    openProduct([corner, cloth, band])
    await findPanel()

    expect(chip(corner.name.th)).toHaveAttribute('aria-pressed', 'true')
    expect(chip(cloth.name.th)).toHaveAttribute('aria-pressed', 'false')
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
})

describe('the pattern library', () => {
  it('offers every pattern of a kind the print area allows', async () => {
    openProduct([cloth])
    await findPanel()

    expect(thumb(seigaiha)).toBeInTheDocument()
    expect(thumb(gingham)).toBeInTheDocument()
    expect(thumb(teak)).toBeInTheDocument()
  })

  it('offers a live chip per kind where the area takes both', async () => {
    openProduct([cloth])
    const panel = await findPanel()

    for (const label of [th.customize.kinds.tile, th.customize.kinds.motif]) {
      const kindChip = within(panel).getByRole('button', {
        name: new RegExp(label),
      })

      expect(kindChip).toBeEnabled()
      expect(kindChip).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('leaves out a pattern of a kind the area does not take', async () => {
    openProduct([band])
    await findPanel()

    expect(thumb(seigaiha)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: named(teak) })).toBeNull()
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
    await user.click(thumb(seigaiha))

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
    await user.click(addLayerButton())
    await user.click(thumb(gingham))

    expect(
      editorStore.getState().design.layers.map((layer) => layer.patternId),
    ).toEqual([seigaiha.id, gingham.id])
  })

  it('adds nothing until that next tap, and says so meanwhile', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    const panel = await findPanel()

    await user.click(thumb(seigaiha))
    expect(panel).not.toHaveTextContent(th.customize.layers.tapAdds)

    await user.click(addLayerButton())

    // The button has done its work by letting the selection go: no second
    // layer yet, and nothing is marked as the one a tap would change.
    expect(editorStore.getState().design.layers).toHaveLength(1)
    expect(editorStore.getState().selectedLayerId).toBeNull()
    expect(panel).toHaveTextContent(th.customize.layers.tapAdds)
    expect(thumb(seigaiha)).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByRole('button', { name: th.customize.layers.add }),
    ).toBeNull()

    await user.click(thumb(gingham))

    expect(editorStore.getState().design.layers).toHaveLength(2)
    expect(panel).not.toHaveTextContent(th.customize.layers.tapAdds)
  })

  it('says the next tap adds once the selected layer is deleted', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    const panel = await findPanel()

    await user.click(thumb(seigaiha))
    await user.click(addLayerButton())
    await user.click(thumb(gingham))

    // Deleted from the layer list, the way a visitor would.
    await user.click(
      screen.getByRole('button', {
        name: th.customize.layers.delete.replace('{{name}}', gingham.name.th),
      }),
    )

    expect(editorStore.getState().design.layers).toHaveLength(1)
    expect(panel).toHaveTextContent(th.customize.layers.tapAdds)
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

describe('laying leaves', () => {
  /**
   * The scale a tap lands a leaf at, taken from the rule itself: what is
   * checked here is that the panel uses it, and `motifPlacement.test.ts` is
   * where the rule's own floor and ceiling are pinned.
   */
  const placedScale = (side: number) =>
    motifPlacement({ x: 0, y: 0, width: side, height: side }).scale

  it('shows the leaves alone once the leaf chip is pressed', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    const panel = await findPanel()

    await user.click(
      within(panel).getByRole('button', {
        name: new RegExp(th.customize.kinds.motif),
      }),
    )

    expect(thumb(teak)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: named(seigaiha) })).toBeNull()
  })

  it('lays the leaf in the middle of the area at a quarter of its shorter side', async () => {
    const user = userEvent.setup()
    openProduct([corner])
    await findPanel()

    await user.click(thumb(teak))

    const { design, selectedLayerId } = editorStore.getState()
    expect(design.layers).toHaveLength(1)
    expect(design.layers[0]).toMatchObject({
      type: 'motif',
      patternId: teak.id,
      printAreaId: corner.id,
      // The fixture's corner is 400×400 from (0,0).
      x: 200,
      y: 200,
      rotation: 0,
      opacity: 1,
      colors: teak.defaultColors,
    })
    expect(design.layers[0]).toHaveProperty(
      'scale',
      expect.closeTo(placedScale(400), 10),
    )
    expect(selectedLayerId).toBe(design.layers[0].id)
  })

  it('swaps the leaf on the selected motif rather than stacking another', async () => {
    const user = userEvent.setup()
    const mango = makePattern({
      id: 'mango',
      kind: 'motif',
      name: { th: 'ใบมะม่วง', en: 'Mango leaf' },
      defaultColors: ['#6B8E3D'],
    })
    openProduct([cloth], [seigaiha, teak, mango])
    await findPanel()

    await user.click(thumb(teak))
    const placed = editorStore.getState().design.layers[0]
    await user.click(thumb(mango))

    const { design } = editorStore.getState()
    expect(design.layers).toHaveLength(1)
    expect(design.layers[0]).toMatchObject({
      id: placed.id,
      patternId: mango.id,
      colors: mango.defaultColors,
      // Where the visitor put it is their work and survives the swap.
      x: 200,
      y: 200,
    })
  })

  it('starts a tile instead of turning the selected leaf into one', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(teak))
    await user.click(thumb(seigaiha))

    expect(
      editorStore.getState().design.layers.map((layer) => layer.type),
    ).toEqual(['motif', 'tile'])
  })

  it('starts a leaf instead of turning the selected tile into one', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(seigaiha))
    await user.click(thumb(teak))

    expect(
      editorStore.getState().design.layers.map((layer) => layer.type),
    ).toEqual(['tile', 'motif'])
  })

  it('throws a handful of leaves across the area in one tap', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(
      screen.getByRole('button', { name: th.customize.layers.scatter }),
    )

    const { design, selectedLayerId } = editorStore.getState()
    expect(design.layers.length).toBeGreaterThanOrEqual(5)
    expect(design.layers.length).toBeLessThanOrEqual(8)
    for (const layer of design.layers) {
      expect(layer.type).toBe('motif')
      expect(layer.printAreaId).toBe(cloth.id)
      // Only leaves: the tiles in this catalog are not thrown.
      expect(layer.patternId).toBe(teak.id)
    }
    // Eight leaves arrive together; singling one out would be a choice the
    // visitor did not make.
    expect(selectedLayerId).toBeNull()
  })

  it('scatters onto the area the chips point at', async () => {
    const user = userEvent.setup()
    openProduct([cloth, corner])
    await findPanel()

    await user.click(chip(corner.name.th))
    await user.click(
      screen.getByRole('button', { name: th.customize.layers.scatter }),
    )

    const areas = new Set(
      editorStore.getState().design.layers.map((layer) => layer.printAreaId),
    )
    expect([...areas]).toEqual([corner.id])
  })

  it('offers no scatter where the area takes tiles alone', async () => {
    openProduct([band])
    await findPanel()

    expect(
      screen.queryByRole('button', { name: th.customize.layers.scatter }),
    ).toBeNull()
  })

  it('lays every leaf in the middle, so a tap always adds somewhere visible', async () => {
    const user = userEvent.setup()
    openProduct([cloth])
    await findPanel()

    await user.click(thumb(teak))
    await user.click(addLayerButton())
    await user.click(thumb(teak))

    const { design } = editorStore.getState()
    expect(design.layers).toHaveLength(2)
    expect(design.layers[1]).toMatchObject({ x: 200, y: 200 })
  })
})
