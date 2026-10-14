/**
 * The right-hand panel once there is something on the cloth: the list of
 * layers, and the sliders that act on the selected one.
 *
 * Layers are put there the way a visitor does it — by tapping patterns in the
 * library — so these cover the two panels working together rather than one in
 * isolation. What the canvas then paints is `tileFill`'s job and is tested
 * next to it.
 */
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Pattern, PrintArea } from '@/catalog'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import { catalogFile, makePattern, makeProduct } from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const seigaiha = makePattern({
  id: 'seigaiha',
  name: { th: 'ลายคลื่น', en: 'Seigaiha waves' },
})
const gingham = makePattern({
  id: 'gingham',
  name: { th: 'ลายตาราง', en: 'Gingham check' },
})

const cloth: PrintArea = {
  id: 'cloth',
  name: { th: 'ทั้งผืน', en: 'Whole cloth' },
  clip: { type: 'rect', x: 0, y: 0, width: 400, height: 400 },
  allowedKinds: ['tile', 'motif'],
}
const band: PrintArea = {
  id: 'end-band',
  name: { th: 'แถบริมผ้า', en: 'End band' },
  clip: { type: 'rect', x: 0, y: 400, width: 400, height: 100 },
  allowedKinds: ['tile'],
}

const product = makeProduct({ id: 'shawl-cotton', printAreas: [cloth, band] })

const openEditor = () =>
  renderApp({
    route: `/customize/${product.id}`,
    files: {
      ...validCatalogFiles,
      'products.json': catalogFile([product]),
      'patterns.json': catalogFile([seigaiha, gingham]),
    },
  })

const library = () =>
  screen.getByRole('region', { name: th.customize.patterns })

const properties = () =>
  screen.getByRole('region', { name: th.customize.properties })

const swatch = (pattern: Pattern) =>
  within(library()).getByRole('button', {
    name: new RegExp(`^${pattern.name.th}`),
  })

/** The row for a layer in the list, by the pattern it is wearing. */
const row = (pattern: Pattern): HTMLElement => {
  const found = within(properties())
    .getAllByRole('listitem')
    .find((item) => item.textContent?.startsWith(pattern.name.th) === true)

  if (found === undefined) throw new Error(`no layer row for ${pattern.id}`)

  return found
}

/**
 * Moves a slider. jsdom gives a range input no keyboard and no drag — the
 * keyboard is the browser's to provide, and Playwright checks it in task 14 —
 * so the change event is fired the way the browser would fire it.
 */
const drag = (label: string, value: number) => {
  fireEvent.change(slider(label), { target: { value: String(value) } })
}

const slider = (label: string) =>
  within(properties()).getByRole('slider', { name: label })

/** Puts `pattern` on the cloth as a new layer and leaves it selected. */
const place = async (
  user: ReturnType<typeof userEvent.setup>,
  pattern: Pattern,
) => {
  const add = within(library()).queryByRole('button', {
    name: th.customize.layers.add,
  })

  if (add !== null) await user.click(add)
  await user.click(swatch(pattern))
}

const openWithLayer = async () => {
  const user = userEvent.setup()
  openEditor()
  await screen.findByRole('region', { name: th.customize.patterns })
  await place(user, seigaiha)

  return user
}

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the layer properties', () => {
  it('says to pick a layer before there is one', async () => {
    openEditor()

    expect(await screen.findByText(th.customize.layer.none)).toBeInTheDocument()
  })

  it('names the selected layer by its pattern and the area it prints on', async () => {
    await openWithLayer()

    expect(properties()).toHaveTextContent(seigaiha.name.th)
    expect(properties()).toHaveTextContent(cloth.name.th)
  })

  it('shows every setting with its value written out', async () => {
    await openWithLayer()

    expect(slider(th.customize.layer.scale)).toHaveValue('1')
    expect(slider(th.customize.layer.rotation)).toHaveValue('0')
    expect(slider(th.customize.layer.offsetX)).toHaveValue('0')
    expect(slider(th.customize.layer.offsetY)).toHaveValue('0')
    expect(slider(th.customize.layer.opacity)).toHaveValue('1')
    expect(properties()).toHaveTextContent('1.00×')
    expect(properties()).toHaveTextContent('0°')
    expect(properties()).toHaveTextContent('100%')
  })

  it('writes a slider move into the design, and shows the number', async () => {
    await openWithLayer()

    drag(th.customize.layer.scale, 1.25)

    expect(editorStore.getState().design.layers[0]).toMatchObject({
      scale: 1.25,
    })
    expect(properties()).toHaveTextContent('1.25×')
  })

  it('turns and shifts the layer', async () => {
    await openWithLayer()

    drag(th.customize.layer.rotation, 360)
    drag(th.customize.layer.offsetX, -300)

    expect(editorStore.getState().design.layers[0]).toMatchObject({
      rotation: 360,
      offsetX: -300,
    })
  })

  it('puts the layer back to how it arrived', async () => {
    const user = await openWithLayer()
    const { design, updateLayer } = editorStore.getState()
    updateLayer(design.layers[0].id, {
      scale: 2,
      rotation: 90,
      offsetX: 40,
      offsetY: 40,
      opacity: 0.4,
      colors: ['#123456'],
    })

    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layer.reset,
      }),
    )

    // One button undoes everything done to this layer, the dyes included.
    expect(editorStore.getState().design.layers[0]).toMatchObject({
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 1,
      colors: seigaiha.defaultColors,
    })
  })

  it('deletes the layer and leaves nothing selected', async () => {
    const user = await openWithLayer()

    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layer.delete,
      }),
    )

    const { design, selectedLayerId } = editorStore.getState()
    expect(design.layers).toEqual([])
    expect(selectedLayerId).toBeNull()
    expect(properties()).toHaveTextContent(th.customize.layer.none)
  })
})

describe('the layer list', () => {
  it('points at the pattern tab while there is nothing on the product', async () => {
    openEditor()

    expect(
      await screen.findByText(th.customize.layers.empty),
    ).toBeInTheDocument()
  })

  it('lists the layers topmost first, as the canvas stacks them', async () => {
    const user = await openWithLayer()
    await place(user, gingham)

    const names = within(properties())
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    expect(
      editorStore.getState().design.layers.map((l) => l.patternId),
    ).toEqual([seigaiha.id, gingham.id])
    expect(names[0]).toContain(gingham.name.th)
    expect(names[1]).toContain(seigaiha.name.th)
  })

  it('selects a layer from the list', async () => {
    const user = await openWithLayer()
    await place(user, gingham)

    await user.click(
      within(row(seigaiha)).getByRole('button', { pressed: false }),
    )

    const { design, selectedLayerId } = editorStore.getState()
    expect(selectedLayerId).toBe(design.layers[0].id)
    expect(properties()).toHaveTextContent(seigaiha.name.th)
  })

  it('moves a layer towards the viewer and back', async () => {
    const user = await openWithLayer()
    await place(user, gingham)

    const order = () =>
      editorStore.getState().design.layers.map((layer) => layer.patternId)

    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layers.moveUp.replace('{{name}}', seigaiha.name.th),
      }),
    )
    expect(order()).toEqual([gingham.id, seigaiha.id])

    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layers.moveDown.replace(
          '{{name}}',
          seigaiha.name.th,
        ),
      }),
    )
    expect(order()).toEqual([seigaiha.id, gingham.id])
  })

  it('cannot move the top layer any higher, nor the bottom one lower', async () => {
    const user = await openWithLayer()
    await place(user, gingham)

    expect(
      within(properties()).getByRole('button', {
        name: th.customize.layers.moveUp.replace('{{name}}', gingham.name.th),
      }),
    ).toBeDisabled()
    expect(
      within(properties()).getByRole('button', {
        name: th.customize.layers.moveDown.replace(
          '{{name}}',
          seigaiha.name.th,
        ),
      }),
    ).toBeDisabled()
  })

  it('deletes one layer and keeps the other', async () => {
    const user = await openWithLayer()
    await place(user, gingham)

    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layers.delete.replace('{{name}}', seigaiha.name.th),
      }),
    )

    expect(
      editorStore.getState().design.layers.map((layer) => layer.patternId),
    ).toEqual([gingham.id])
  })

  it('says which area each layer prints on', async () => {
    const user = await openWithLayer()
    await user.click(
      within(library()).getByRole('button', { name: band.name.th }),
    )
    await place(user, gingham)

    expect(row(gingham)).toHaveTextContent(band.name.th)
  })
})
