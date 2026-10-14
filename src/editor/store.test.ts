/**
 * Every action, on a store of its own so the tests cannot leak state into one
 * another. They check the design the way a share link would read it: what is
 * in `layers`, in what order, and what the visitor has selected.
 */
import { describe, expect, it } from 'vitest'
import type { MotifLayer, TileLayer } from '@/catalog'
import { makeProduct } from '@/test/catalogFixtures'
import {
  createEditorStore,
  createLayerId,
  emptyDesign,
  FALLBACK_BASE_COLOR,
  type NewLayer,
} from './store'

const tile = (overrides: Partial<Omit<TileLayer, 'id'>> = {}): NewLayer => ({
  type: 'tile',
  patternId: 'seigaiha',
  printAreaId: 'cloth',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
  ...overrides,
})

const motif = (overrides: Partial<Omit<MotifLayer, 'id'>> = {}): NewLayer => ({
  type: 'motif',
  patternId: 'teak-leaf',
  printAreaId: 'cloth',
  x: 100,
  y: 100,
  scale: 1,
  rotation: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
  ...overrides,
})

/** A store with the fixture product open and `count` tile layers on it. */
function openedStore(count = 0) {
  const store = createEditorStore()
  store.getState().initForProduct(makeProduct())

  const ids = Array.from({ length: count }, (_, index) =>
    store.getState().addLayer(tile({ patternId: `pattern-${index}` })),
  )

  return { store, ids }
}

const patternIds = (store: ReturnType<typeof createEditorStore>) =>
  store.getState().design.layers.map((layer) => layer.patternId)

describe('createLayerId', () => {
  it('gives a different id each time', () => {
    const ids = new Set(Array.from({ length: 50 }, createLayerId))

    expect(ids.size).toBe(50)
  })
})

describe('initForProduct', () => {
  it('starts an empty design in the first base colour the product lists', () => {
    const store = createEditorStore()

    store.getState().initForProduct(
      makeProduct({
        id: 'shawl-cotton',
        baseColors: ['#F3EADA', '#6B8E3D'],
      }),
    )

    expect(store.getState().design).toEqual({
      version: 1,
      productId: 'shawl-cotton',
      baseColor: '#F3EADA',
      layers: [],
    })
  })

  it('selects the first print area and no layer', () => {
    const store = createEditorStore()

    store.getState().initForProduct(makeProduct())

    expect(store.getState().selectedPrintAreaId).toBe('cloth')
    expect(store.getState().selectedLayerId).toBeNull()
  })

  it('falls back when the product lists no base colour or print area', () => {
    const store = createEditorStore()

    store
      .getState()
      .initForProduct(makeProduct({ baseColors: [], printAreas: [] }))

    expect(store.getState().design.baseColor).toBe(FALLBACK_BASE_COLOR)
    expect(store.getState().selectedPrintAreaId).toBeNull()
  })

  it('starts over when the same product is opened again', () => {
    const { store } = openedStore(2)

    store.getState().initForProduct(makeProduct())

    expect(store.getState().design.layers).toEqual([])
    expect(store.getState().selectedLayerId).toBeNull()
  })
})

describe('setBaseColor', () => {
  it('changes the colour and keeps the layers', () => {
    const { store } = openedStore(1)

    store.getState().setBaseColor('#6B8E3D')

    expect(store.getState().design.baseColor).toBe('#6B8E3D')
    expect(store.getState().design.layers).toHaveLength(1)
  })
})

describe('addLayer', () => {
  it('appends the layer with an id and returns it', () => {
    const { store } = openedStore()

    const id = store.getState().addLayer(motif({ x: 42 }))
    const [layer] = store.getState().design.layers

    expect(layer).toEqual({ ...motif({ x: 42 }), id })
  })

  it('selects the layer it added', () => {
    const { store } = openedStore()

    const id = store.getState().addLayer(tile())

    expect(store.getState().selectedLayerId).toBe(id)
  })

  it('stacks later layers nearer the viewer', () => {
    const { store } = openedStore(3)

    expect(patternIds(store)).toEqual(['pattern-0', 'pattern-1', 'pattern-2'])
  })
})

describe('updateLayer', () => {
  it('merges the patch into that layer only', () => {
    const { store, ids } = openedStore(2)

    store.getState().updateLayer(ids[0], { scale: 2, opacity: 0.5 })
    const [first, second] = store.getState().design.layers

    expect(first).toMatchObject({ scale: 2, opacity: 0.5, rotation: 0 })
    expect(second).toMatchObject({ scale: 1, opacity: 1 })
  })

  it('patches a motif by its own position fields', () => {
    const { store } = openedStore()
    const id = store.getState().addLayer(motif())

    store.getState().updateLayer(id, { x: 300, y: 250 })

    expect(store.getState().design.layers[0]).toMatchObject({
      x: 300,
      y: 250,
    })
  })

  it('leaves the design alone for an unknown id', () => {
    const { store } = openedStore(1)
    const before = store.getState().design

    store.getState().updateLayer('no-such-layer', { scale: 9 })

    expect(store.getState().design.layers).toEqual(before.layers)
  })
})

describe('removeLayer', () => {
  it('removes just that layer', () => {
    const { store, ids } = openedStore(3)

    store.getState().removeLayer(ids[1])

    expect(patternIds(store)).toEqual(['pattern-0', 'pattern-2'])
  })

  it('clears the selection when the selected layer goes', () => {
    const { store, ids } = openedStore(2)

    store.getState().selectLayer(ids[0])
    store.getState().removeLayer(ids[0])

    expect(store.getState().selectedLayerId).toBeNull()
  })

  it('keeps the selection when another layer goes', () => {
    const { store, ids } = openedStore(2)

    store.getState().selectLayer(ids[0])
    store.getState().removeLayer(ids[1])

    expect(store.getState().selectedLayerId).toBe(ids[0])
  })
})

describe('reorderLayer', () => {
  it('moves a layer up, nearer the viewer', () => {
    const { store, ids } = openedStore(3)

    store.getState().reorderLayer(ids[0], 'up')

    expect(patternIds(store)).toEqual(['pattern-1', 'pattern-0', 'pattern-2'])
  })

  it('moves a layer down', () => {
    const { store, ids } = openedStore(3)

    store.getState().reorderLayer(ids[2], 'down')

    expect(patternIds(store)).toEqual(['pattern-0', 'pattern-2', 'pattern-1'])
  })

  it('does nothing at either end of the stack', () => {
    const { store, ids } = openedStore(2)

    store.getState().reorderLayer(ids[0], 'down')
    store.getState().reorderLayer(ids[1], 'up')

    expect(patternIds(store)).toEqual(['pattern-0', 'pattern-1'])
  })

  it('does nothing for an unknown id', () => {
    const { store } = openedStore(2)

    store.getState().reorderLayer('no-such-layer', 'up')

    expect(patternIds(store)).toEqual(['pattern-0', 'pattern-1'])
  })
})

describe('selectLayer', () => {
  it('selects the layer and the area it prints on', () => {
    const { store } = openedStore()
    const id = store.getState().addLayer(tile({ printAreaId: 'border' }))

    store.getState().selectPrintArea('cloth')
    store.getState().selectLayer(id)

    expect(store.getState().selectedLayerId).toBe(id)
    expect(store.getState().selectedPrintAreaId).toBe('border')
  })

  it('clears the selection without touching the print area', () => {
    const { store, ids } = openedStore(1)

    store.getState().selectLayer(ids[0])
    store.getState().selectLayer(null)

    expect(store.getState().selectedLayerId).toBeNull()
    expect(store.getState().selectedPrintAreaId).toBe('cloth')
  })
})

describe('selectPrintArea', () => {
  it('sets and clears the selected area', () => {
    const { store } = openedStore()

    store.getState().selectPrintArea('border')
    expect(store.getState().selectedPrintAreaId).toBe('border')

    store.getState().selectPrintArea(null)
    expect(store.getState().selectedPrintAreaId).toBeNull()
  })
})

describe('setShowPrintAreas', () => {
  it('starts off and turns on and off again', () => {
    const { store } = openedStore()

    expect(store.getState().showPrintAreas).toBe(false)

    store.getState().setShowPrintAreas(true)
    expect(store.getState().showPrintAreas).toBe(true)

    store.getState().setShowPrintAreas(false)
    expect(store.getState().showPrintAreas).toBe(false)
  })

  it('leaves the design alone — it is a way of looking, not a change', () => {
    const { store } = openedStore(1)
    const before = store.getState().design

    store.getState().setShowPrintAreas(true)

    expect(store.getState().design).toBe(before)
  })
})

describe('reset', () => {
  it('goes back to the empty state', () => {
    const { store } = openedStore(2)

    store.getState().setBaseColor('#6B8E3D')
    store.getState().setShowPrintAreas(true)
    store.getState().reset()

    expect(store.getState()).toMatchObject({
      design: emptyDesign,
      selectedLayerId: null,
      selectedPrintAreaId: null,
      showPrintAreas: false,
    })
  })
})
