/**
 * What the visitor currently has their hands on.
 *
 * The library needs one answer in particular: does tapping a pattern change
 * the layer that is selected, or start another one? Trying patterns is the
 * common thing — tap seigaiha, then gingham, then back — and a tap that
 * stacked a new layer every time would quietly build a pile of hidden layers
 * out of what looked like changing your mind. So a tap replaces the pattern on
 * the selected tile when that tile is on the area being worked on, and adds a
 * layer in every other case: nothing selected, a motif selected, or a tile
 * that prints somewhere else.
 */
import type { Design, TileLayer } from '@/catalog'

/**
 * The tile layer a tap on a pattern would change, or `undefined` when the tap
 * should add a layer instead.
 */
export function replaceableTile(
  design: Design,
  selectedLayerId: string | null,
  printAreaId: string,
): TileLayer | undefined {
  const layer = design.layers.find((entry) => entry.id === selectedLayerId)

  if (layer === undefined || layer.type !== 'tile') return undefined

  return layer.printAreaId === printAreaId ? layer : undefined
}
