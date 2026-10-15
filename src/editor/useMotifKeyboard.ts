/**
 * The keyboard half of handling a leaf: nudge it, copy it, throw it away.
 *
 * Bound to the canvas and nowhere else. A design editor that listened on the
 * window would delete a leaf while someone was typing in the search box, and
 * arrows would stop scrolling the page the moment a layer happened to be
 * selected — so the handler goes on the canvas, which is focusable, and only
 * fires for key presses that land inside it.
 *
 * It acts on the selected layer when that layer is a leaf. A tile has no place
 * of its own to nudge and is not selectable on the canvas in the first place,
 * so with a tile selected every key falls through to the browser.
 *
 * Nudges are clamped exactly as a drag is (`clampMotifCenter`), so the
 * keyboard cannot put a leaf anywhere the pointer could not.
 */
import { useCallback, type KeyboardEvent } from 'react'
import type { Product } from '@/catalog'
import { areaBounds } from './areaBounds'
import { motifKeyAction } from './motifKeys'
import { clampMotifCenter, duplicateMotif } from './motifPlacement'
import { useDesignStore } from './useDesignStore'

export type MotifKeyHandler = (event: KeyboardEvent<HTMLElement>) => void

export function useMotifKeyboard(product: Product): MotifKeyHandler {
  const layers = useDesignStore((state) => state.design.layers)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)
  const addLayer = useDesignStore((state) => state.addLayer)

  return useCallback(
    (event) => {
      const layer = layers.find((entry) => entry.id === selectedLayerId)

      if (layer === undefined || layer.type !== 'motif') return

      const action = motifKeyAction(event)

      if (action === null) return

      // Only once this is a key the editor answers: otherwise Tab would stop
      // moving on, and the page would stop scrolling.
      event.preventDefault()

      if (action.type === 'delete') {
        removeLayer(layer.id)
        return
      }

      const area = product.printAreas.find(
        (entry) => entry.id === layer.printAreaId,
      )

      // A layer naming an area the product does not have is a broken design
      // (see `scene.ts`); it can still be deleted, which is the way out of it.
      if (area === undefined) return

      const bounds = areaBounds(area.clip)

      if (action.type === 'duplicate') {
        addLayer(duplicateMotif(layer, bounds))
        return
      }

      updateLayer(
        layer.id,
        clampMotifCenter(
          { x: layer.x + action.dx, y: layer.y + action.dy },
          bounds,
        ),
      )
    },
    [addLayer, layers, product, removeLayer, selectedLayerId, updateLayer],
  )
}
