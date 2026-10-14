/**
 * The editor's state: one `Design` plus what the visitor currently has
 * selected.
 *
 * Built with zustand's vanilla `createStore`, so this module pulls in neither
 * React nor Konva. Two reasons: the actions can be unit tested as plain
 * functions, and `zundo`'s `temporal` middleware can wrap the same creator for
 * undo/redo in task 11 without this file changing. React reads it through
 * `useDesignStore`.
 *
 * `Design` holds exactly what a share link serializes (see the domain model in
 * docs/PROJECT_BRIEF.md) — selection lives outside it, because which layer is
 * highlighted is not part of the design.
 *
 * `layers` is in render order: the first entry is drawn first, so the last
 * entry sits nearest the viewer.
 */
import { createStore } from 'zustand/vanilla'
import type { Design, Layer, MotifLayer, Product, TileLayer } from '@/catalog'

/** Stands in for a product's own first base colour when it lists none. */
export const FALLBACK_BASE_COLOR = '#ffffff'

/** A layer as a caller hands it over: the store assigns the id. */
export type NewLayer = Omit<TileLayer, 'id'> | Omit<MotifLayer, 'id'>

/**
 * The fields of one layer a tool may change. `id` and `type` are left out: a
 * layer never changes kind, and its id is its identity.
 */
export type LayerPatch =
  | Partial<Omit<TileLayer, 'id' | 'type'>>
  | Partial<Omit<MotifLayer, 'id' | 'type'>>

/** Which way `reorderLayer` moves a layer through the render order. */
export type ReorderDirection = 'up' | 'down'

export type EditorState = {
  design: Design
  selectedLayerId: string | null
  selectedPrintAreaId: string | null
}

export type EditorActions = {
  /**
   * Starts a design for `product`: its first base colour, no layers, its first
   * print area selected. Called again for the same product it starts over.
   */
  initForProduct: (product: Product) => void
  setBaseColor: (color: string) => void
  /** Appends the layer on top of the others, selects it, returns its new id. */
  addLayer: (layer: NewLayer) => string
  /** Merges `patch` into the layer; an unknown id leaves the design alone. */
  updateLayer: (id: string, patch: LayerPatch) => void
  removeLayer: (id: string) => void
  /** `up` moves the layer nearer the viewer. At either end it does nothing. */
  reorderLayer: (id: string, direction: ReorderDirection) => void
  selectLayer: (id: string | null) => void
  selectPrintArea: (id: string | null) => void
  /** Back to the empty state, as if no product had been opened yet. */
  reset: () => void
}

export type EditorStore = EditorState & EditorActions

/** An empty design, before any product is opened. */
export const emptyDesign: Design = {
  version: 1,
  productId: '',
  baseColor: FALLBACK_BASE_COLOR,
  layers: [],
}

const initialState: EditorState = {
  design: emptyDesign,
  selectedLayerId: null,
  selectedPrintAreaId: null,
}

/**
 * A fresh layer id. `crypto.randomUUID` needs a secure context, so a page
 * served over plain http on the community's own laptop falls back to a random
 * string — unique enough for ids that only have to be distinct within one
 * design.
 */
export function createLayerId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  const random = Math.random().toString(36).slice(2, 10)
  return `layer-${Date.now().toString(36)}-${random}`
}

/**
 * The design a product starts with: its first base colour and no layers.
 *
 * Exported because React needs it before the store has caught up — a page
 * opening a product can draw its starting design on the first paint, and
 * `initForProduct` writes exactly the same thing a moment later.
 */
export function designForProduct(product: Product): Design {
  return {
    version: 1,
    productId: product.id,
    baseColor: product.baseColors[0] ?? FALLBACK_BASE_COLOR,
    layers: [],
  }
}

/**
 * Spreads the patch over the layer of its own kind, so a tile keeps its
 * `offsetX/offsetY` and a motif its `x/y`.
 */
function patchLayer(layer: Layer, patch: LayerPatch): Layer {
  if (layer.type === 'tile') {
    const tilePatch: Partial<TileLayer> = patch
    return { ...layer, ...tilePatch }
  }

  const motifPatch: Partial<MotifLayer> = patch
  return { ...layer, ...motifPatch }
}

/** Moves the entry at `from` to `to`, or returns the same array if it cannot. */
function moveLayer(layers: Layer[], from: number, to: number): Layer[] {
  if (from < 0 || to < 0 || to >= layers.length) return layers

  const next = [...layers]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * The store creator, kept separate from the instance so tests (and later
 * `temporal`) can build their own store.
 */
export const createEditorStore = () =>
  createStore<EditorStore>()((set, get) => ({
    ...initialState,

    initForProduct: (product) =>
      set({
        design: designForProduct(product),
        selectedLayerId: null,
        selectedPrintAreaId: product.printAreas[0]?.id ?? null,
      }),

    setBaseColor: (color) =>
      set(({ design }) => ({ design: { ...design, baseColor: color } })),

    addLayer: (layer) => {
      const id = createLayerId()

      set(({ design }) => ({
        design: { ...design, layers: [...design.layers, { ...layer, id }] },
        selectedLayerId: id,
      }))

      return id
    },

    updateLayer: (id, patch) =>
      set(({ design }) => ({
        design: {
          ...design,
          layers: design.layers.map((layer) =>
            layer.id === id ? patchLayer(layer, patch) : layer,
          ),
        },
      })),

    removeLayer: (id) =>
      set(({ design, selectedLayerId }) => ({
        design: {
          ...design,
          layers: design.layers.filter((layer) => layer.id !== id),
        },
        // Nothing is selected once the selected layer is gone.
        selectedLayerId: selectedLayerId === id ? null : selectedLayerId,
      })),

    reorderLayer: (id, direction) =>
      set(({ design }) => {
        const from = design.layers.findIndex((layer) => layer.id === id)
        const to = direction === 'up' ? from + 1 : from - 1
        const layers = moveLayer(design.layers, from, to)

        return layers === design.layers ? {} : { design: { ...design, layers } }
      }),

    selectLayer: (id) => {
      // Selecting a layer also moves the focus to the area it prints on, so
      // the tools act where the visitor is looking.
      const layer = get().design.layers.find((entry) => entry.id === id)

      set({
        selectedLayerId: id,
        ...(layer ? { selectedPrintAreaId: layer.printAreaId } : {}),
      })
    },

    selectPrintArea: (id) => set({ selectedPrintAreaId: id }),

    reset: () => set(initialState),
  }))

/** The app's single editor store. */
export const editorStore = createEditorStore()
