/**
 * The desktop keyboard: nudge, delete and duplicate the selected leaf — and,
 * just as much, do none of that while the focus is somewhere else.
 *
 * Driven through the page with real focus and real key presses, because where
 * the handler is bound is the whole question. A canvas that listened on the
 * window would delete a leaf while someone was typing in the search box.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MotifLayer, PrintArea } from '@/catalog'
import { NUDGE, NUDGE_FAR } from '@/editor/motifKeys'
import { editorStore } from '@/editor/store'
import th from '@/i18n/th.json'
import { catalogFile, makePattern, makeProduct } from '@/test/catalogFixtures'
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
  leafIds: ['teak'],
})

const product = makeProduct({ id: 'handkerchief', printAreas: [corner] })

/** Opens the editor, lays one leaf, and hands back the canvas. */
const layLeaf = async (user: ReturnType<typeof userEvent.setup>) => {
  renderApp({
    route: `/customize/${product.id}`,
    files: {
      ...validCatalogFiles,
      'products.json': catalogFile([product]),
      'patterns.json': catalogFile([teak]),
    },
  })

  const library = await screen.findByRole('region', {
    name: th.customize.patterns,
  })
  await user.click(
    within(library).getByRole('button', {
      name: new RegExp(`^${teak.name.th}`),
    }),
  )

  return screen.getByRole('application', { name: th.customize.canvas })
}

const leaf = () => {
  const { design, selectedLayerId } = editorStore.getState()

  return design.layers.find((entry) => entry.id === selectedLayerId) as
    MotifLayer | undefined
}

const motifs = () => editorStore.getState().design.layers

beforeEach(() => {
  vi.stubEnv('VITE_FLAGS', 'motifs')
  editorStore.getState().reset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('with the canvas focused', () => {
  it('nudges the leaf with an arrow', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)
    const { x = 0, y = 0 } = leaf() ?? {}

    canvas.focus()
    await user.keyboard('{ArrowRight}')
    expect(leaf()).toMatchObject({ x: x + NUDGE, y })

    await user.keyboard('{ArrowUp}')
    expect(leaf()).toMatchObject({ x: x + NUDGE, y: y - NUDGE })
  })

  it('nudges further with Shift held', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)
    const { x = 0 } = leaf() ?? {}

    canvas.focus()
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')

    expect(leaf()?.x).toBe(x + NUDGE_FAR)
  })

  it('stops the leaf at the edge of its print area', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)

    canvas.focus()
    // The centre starts at 300 and the edge is 200 away: a dozen far nudges
    // is comfortably past it.
    for (let i = 0; i < 12; i += 1) {
      await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    }

    // The fixture's corner runs to x = 500, and a leaf's centre may reach the
    // edge but not pass it — the same rule a drag follows.
    expect(leaf()?.x).toBe(500)
  })

  it('duplicates with Ctrl+D and selects the copy', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)
    const first = leaf()

    canvas.focus()
    await user.keyboard('{Control>}d{/Control}')

    expect(motifs()).toHaveLength(2)
    expect(leaf()?.id).not.toBe(first?.id)
    expect(leaf()?.patternId).toBe(teak.id)
  })

  it('duplicates with Cmd+D too', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)

    canvas.focus()
    await user.keyboard('{Meta>}d{/Meta}')

    expect(motifs()).toHaveLength(2)
  })

  it('deletes with Delete', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)

    canvas.focus()
    await user.keyboard('{Delete}')

    expect(motifs()).toHaveLength(0)
    expect(editorStore.getState().selectedLayerId).toBeNull()
  })

  it('leaves a key it has no use for alone', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)
    const before = leaf()

    canvas.focus()
    await user.keyboard('a{Enter}')

    expect(leaf()).toEqual(before)
    expect(motifs()).toHaveLength(1)
  })

  it('does nothing once the leaf is let go of', async () => {
    const user = userEvent.setup()
    const canvas = await layLeaf(user)
    const before = motifs()[0]

    editorStore.getState().selectLayer(null)
    canvas.focus()
    await user.keyboard('{ArrowRight}{Delete}')

    expect(motifs()).toEqual([before])
  })
})

describe('with the focus anywhere else', () => {
  it('ignores the same keys', async () => {
    const user = userEvent.setup()
    await layLeaf(user)
    const before = leaf()

    // The library's own button, which is where the focus is after laying a
    // leaf: arrows must scroll the panel and Delete must do nothing at all.
    await user.keyboard('{ArrowRight}{ArrowDown}{Delete}')

    expect(leaf()).toEqual(before)
    expect(motifs()).toHaveLength(1)
  })

  it('leaves a typed search box alone, including its delete key', async () => {
    const user = userEvent.setup()
    await layLeaf(user)
    const before = leaf()

    const search = screen.getByRole('searchbox')
    await user.type(search, 'ใบ')
    await user.keyboard('{Backspace}{ArrowLeft}')

    expect(leaf()).toEqual(before)
    expect(motifs()).toHaveLength(1)
  })
})
