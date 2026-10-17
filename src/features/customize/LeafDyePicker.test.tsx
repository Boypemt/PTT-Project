/**
 * Choosing a leaf dye for the selected layer.
 *
 * The dyes are fixtures rather than the real `leaf-dyes.json`, whose hexes are
 * placeholders waiting to be matched against fabric samples — these would then
 * be testing the catalog instead of the panel. What the canvas does with the
 * colours afterwards is `recolorSvg`'s job and is tested next to it.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LeafDye, Pattern } from '@/catalog'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import {
  catalogFile,
  makeLeafDye,
  makePattern,
  makeProduct,
} from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const TEAK_PURPLE = '#4B2A4F'
const TEAK_PINK = '#A23B62'
const MANGO_GREEN = '#6B8E3D'

const teak: LeafDye = {
  id: 'teak',
  name: { th: 'ใบสัก', en: 'Teak leaf' },
  colors: [
    {
      id: 'deep-purple',
      name: { th: 'ม่วงเข้ม', en: 'Deep purple' },
      hex: TEAK_PURPLE,
    },
    {
      id: 'deep-pink',
      name: { th: 'ชมพูเข้ม', en: 'Deep pink' },
      hex: TEAK_PINK,
    },
  ],
}

const mango: LeafDye = {
  id: 'mango',
  name: { th: 'ใบมะม่วงเบา', en: 'Mango leaf' },
  colors: [
    { id: 'green', name: { th: 'เขียว', en: 'Green' }, hex: MANGO_GREEN },
  ],
}

/** Two colours, so the panel offers a second slot. */
const twoColors = makePattern({
  id: 'seigaiha',
  name: { th: 'ลายคลื่น', en: 'Seigaiha waves' },
  defaultColors: ['#111111', '#222222'],
  leafIds: ['teak'],
})

/** One colour, so it does not. */
const oneColor = makePattern({
  id: 'gingham',
  name: { th: 'ลายตาราง', en: 'Gingham check' },
  defaultColors: ['#333333'],
  leafIds: ['teak'],
})

/** A photographed pattern: its colours are printed into the file. */
const photographed = makePattern({
  id: 'lemons',
  name: { th: 'ลายมะนาว', en: 'Lemons' },
  src: '/catalog/patterns/community/lemons.webp',
  recolorable: false,
  defaultColors: [],
  leafIds: undefined,
  source: { type: 'community', credit: 'Designer TBC', license: 'TBC' },
})

const product = makeProduct({ id: 'shawl-cotton' })

const openEditor = (patterns: Pattern[] = [twoColors, oneColor]) =>
  renderApp({
    route: `/customize/${product.id}`,
    files: {
      ...validCatalogFiles,
      'leaf-dyes.json': catalogFile([
        teak,
        mango,
        makeLeafDye({ id: 'other' }),
      ]),
      'products.json': catalogFile([product]),
      'patterns.json': catalogFile(patterns),
    },
  })

const properties = () =>
  screen.getByRole('region', { name: th.customize.properties })

const dyeSwatch = (leaf: LeafDye, index = 0) =>
  within(properties()).getAllByRole('button', {
    name: `${leaf.name.th} — ${leaf.colors[index].name.th}`,
  })

/** Puts `pattern` on the cloth and leaves it selected. */
const place = async (
  user: ReturnType<typeof userEvent.setup>,
  pattern: Pattern,
) => {
  const library = await screen.findByRole('region', {
    name: th.customize.patterns,
  })

  await user.click(
    within(library).getByRole('button', {
      name: new RegExp(`^${pattern.name.th}`),
    }),
  )
}

const layer = () => editorStore.getState().design.layers[0]

beforeEach(() => {
  editorStore.getState().reset()
})

describe('the leaf dye colours', () => {
  it('offers every leaf in the catalog, by name', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    expect(properties()).toHaveTextContent(th.customize.leafDyes.title)
    expect(properties()).toHaveTextContent(teak.name.th)
    expect(properties()).toHaveTextContent(mango.name.th)
    expect(dyeSwatch(teak, 1)[0]).toBeInTheDocument()
  })

  it('offers no dyes for a pattern that cannot be recoloured', async () => {
    const user = userEvent.setup()
    openEditor([photographed, oneColor])
    await place(user, photographed)

    // Hidden rather than disabled: a row of swatches that refuses every tap
    // reads as something broken.
    expect(properties()).not.toHaveTextContent(th.customize.leafDyes.title)
    expect(properties()).not.toHaveTextContent(teak.name.th)

    // The rest of the layer's settings are untouched — it is the colours that
    // do not apply to it, not the layer.
    expect(properties()).toHaveTextContent(th.customize.layer.scale)
    expect(properties()).toHaveTextContent(th.customize.layer.opacity)
  })

  it('shows nothing to colour until a layer is selected', async () => {
    openEditor()
    await screen.findByRole('region', { name: th.customize.properties })

    expect(properties()).not.toHaveTextContent(th.customize.leafDyes.title)
  })

  it('prints the layer in the dye that was tapped', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    await user.click(dyeSwatch(teak, 1)[0])

    expect(layer().colors[0]).toBe(TEAK_PINK)
  })

  it('keeps the pattern second colour when only the first is chosen', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    await user.click(dyeSwatch(mango)[0])

    expect(layer().colors).toEqual([MANGO_GREEN, twoColors.defaultColors[1]])
  })

  it('sets the second colour from the second group', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    // Two groups, so each dye has two swatches of the same colour: one per
    // slot, in the order the groups are written.
    await user.click(dyeSwatch(teak, 0)[1])

    expect(layer().colors).toEqual([twoColors.defaultColors[0], TEAK_PURPLE])
  })

  it('offers one group for a pattern drawn in one colour', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, oneColor)

    expect(properties()).toHaveTextContent(th.customize.leafDyes.main)
    expect(properties()).not.toHaveTextContent(th.customize.leafDyes.second)
    expect(dyeSwatch(mango)).toHaveLength(1)
  })

  it('marks the dye the layer is wearing, in the slot it is in', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    await user.click(dyeSwatch(teak, 1)[0])

    expect(dyeSwatch(teak, 1)[0]).toHaveAttribute('aria-pressed', 'true')
    expect(dyeSwatch(teak, 1)[1]).toHaveAttribute('aria-pressed', 'false')
    expect(dyeSwatch(mango)[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('gives the pattern its own dyes back when the layer is reset', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)

    await user.click(dyeSwatch(teak, 1)[0])
    await user.click(
      within(properties()).getByRole('button', {
        name: th.customize.layer.reset,
      }),
    )

    expect(layer().colors).toEqual(twoColors.defaultColors)
  })

  it('leaves the rest of the layer alone', async () => {
    const user = userEvent.setup()
    openEditor()
    await place(user, twoColors)
    editorStore.getState().updateLayer(layer().id, { scale: 1.5, rotation: 30 })

    await user.click(dyeSwatch(mango)[0])

    expect(layer()).toMatchObject({
      patternId: twoColors.id,
      scale: 1.5,
      rotation: 30,
    })
  })
})
