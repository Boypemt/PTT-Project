/**
 * The leaf's own settings panel: the sliders that act on it, and the three
 * buttons that act on the leaf itself.
 *
 * Driven through the page like a visitor would — tap a leaf in the library,
 * then work on it in the properties panel — so what is checked is that the
 * panel is wired to the store the canvas draws from, not that a component
 * renders. The flag is on throughout: with it off there is no leaf to select,
 * which `PatternsPanel.test.tsx` is the check for.
 */
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MotifLayer, PrintArea } from '@/catalog'
import { motifPlacement } from '@/editor/motifPlacement'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import {
  catalogFile,
  makeLeafDye,
  makePattern,
  makeProduct,
} from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const corner: PrintArea = {
  id: 'corner',
  name: { th: 'TH Corner', en: 'Corner' },
  clip: { type: 'rect', x: 100, y: 100, width: 400, height: 400 },
  allowedKinds: ['motif'],
}

const teak = makePattern({
  id: 'teak',
  kind: 'motif',
  name: { th: 'ใบสัก', en: 'Teak leaf' },
  // Deliberately not the fixture dye's own hex, so a tap on a swatch is a
  // change this test can see.
  defaultColors: ['#2E2E2E', '#777777'],
  leafIds: ['teak'],
})

const product = makeProduct({ id: 'handkerchief', printAreas: [corner] })

const open = () => {
  renderApp({
    route: `/customize/${product.id}`,
    files: {
      ...validCatalogFiles,
      'products.json': catalogFile([product]),
      'patterns.json': catalogFile([teak]),
    },
  })
}

/** Taps the leaf in the library, which lays it and selects it. */
const layLeaf = async (user: ReturnType<typeof userEvent.setup>) => {
  const panel = await screen.findByRole('region', {
    name: th.customize.patterns,
  })

  await user.click(
    within(panel).getByRole('button', { name: new RegExp(`^${teak.name.th}`) }),
  )
}

const motifLayers = () =>
  editorStore.getState().design.layers.filter((l) => l.type === 'motif')

const selected = () => {
  const { design, selectedLayerId } = editorStore.getState()
  const layer = design.layers.find((entry) => entry.id === selectedLayerId)

  return layer as MotifLayer | undefined
}

const button = (name: string) => screen.getByRole('button', { name })

beforeEach(() => {
  vi.stubEnv('VITE_FLAGS', 'motifs')
  editorStore.getState().reset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the motif properties panel', () => {
  it('names the leaf and the area it prints on', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    const properties = screen.getByRole('region', {
      name: th.customize.properties,
    })

    expect(properties).toHaveTextContent(teak.name.th)
    expect(properties).toHaveTextContent(corner.name.th)
  })

  it('offers size, rotation and strength, and no tile offsets', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    for (const label of [
      th.customize.layer.scale,
      th.customize.layer.rotation,
      th.customize.layer.opacity,
    ]) {
      expect(screen.getByLabelText(label, { exact: true })).toBeInTheDocument()
    }

    // A leaf is moved by dragging it on the cloth.
    expect(screen.queryByLabelText(th.customize.layer.offsetX)).toBeNull()
    expect(screen.queryByLabelText(th.customize.layer.offsetY)).toBeNull()
  })

  it('turns the leaf from the rotation slider', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    // jsdom gives a range input no keyboard and no drag, so the move is the
    // change event React listens for — as in LayerControls.test.tsx.
    fireEvent.change(
      screen.getByRole('slider', { name: th.customize.layer.rotation }),
      { target: { value: '45' } },
    )

    expect(selected()?.rotation).toBe(45)
  })

  it('sizes and fades the leaf from the other two sliders', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    fireEvent.change(
      screen.getByRole('slider', { name: th.customize.layer.scale }),
      { target: { value: '1.5' } },
    )
    fireEvent.change(
      screen.getByRole('slider', { name: th.customize.layer.opacity }),
      { target: { value: '0.5' } },
    )

    expect(selected()).toMatchObject({ scale: 1.5, opacity: 0.5 })
  })

  it('dyes the leaf from the leaf-dye swatches', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    const before = selected()?.colors[0]
    const properties = screen.getByRole('region', {
      name: th.customize.properties,
    })
    const dye = makeLeafDye()
    await user.click(
      within(properties).getAllByRole('button', {
        name: `${dye.name.th} — ${dye.colors[0].name.th}`,
      })[0],
    )

    expect(selected()?.colors[0]).toBe(dye.colors[0].hex)
    expect(selected()?.colors[0]).not.toBe(before)
  })

  it('copies the leaf beside itself and selects the copy', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    const first = selected()
    await user.click(button(th.customize.layer.duplicate))

    const layers = motifLayers()
    expect(layers).toHaveLength(2)
    expect(selected()?.id).toBe(layers[1].id)
    expect(layers[1].patternId).toBe(first?.patternId)
    // Beside, not on top of — a copy you cannot see is a copy that looks like
    // nothing happened.
    expect(layers[1].x).toBeGreaterThan(layers[0].x)
    expect(layers[1].y).toBeGreaterThan(layers[0].y)
  })

  it('does not let the copy share the original colours array', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)
    await user.click(button(th.customize.layer.duplicate))

    const [first, second] = motifLayers()
    expect(second.colors).toEqual(first.colors)
    expect(second.colors).not.toBe(first.colors)
  })

  it('puts the leaf back the way it arrived, where it stands', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    const placed = selected()
    editorStore.getState().updateLayer(placed?.id ?? '', {
      x: 180,
      y: 220,
      scale: 1.8,
      rotation: 120,
      opacity: 0.3,
      colors: ['#000000'],
    })

    await user.click(button(th.customize.layer.reset))

    expect(selected()).toMatchObject({
      scale: motifPlacement({ x: 100, y: 100, width: 400, height: 400 }).scale,
      rotation: 0,
      opacity: 1,
      colors: teak.defaultColors,
      // Where the visitor put it is the one thing they chose by hand.
      x: 180,
      y: 220,
    })
  })

  it('throws the leaf away, and says nothing is selected after', async () => {
    const user = userEvent.setup()
    open()
    await layLeaf(user)

    await user.click(button(th.customize.layer.delete))

    expect(motifLayers()).toHaveLength(0)
    expect(
      screen.getByRole('region', { name: th.customize.properties }),
    ).toHaveTextContent(th.customize.layer.none)
  })
})
