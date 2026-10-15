/**
 * What the visitor currently has their hands on.
 *
 * The library needs one answer in particular: does tapping a pattern change
 * the layer that is selected, or start another one? Trying patterns is the
 * common thing — tap seigaiha, then gingham, then back — and a tap that
 * stacked a new layer every time would quietly build a pile of hidden layers
 * out of what looked like changing your mind. So a tap replaces the pattern on
 * the selected layer when that layer is on the area being worked on and is of
 * the same kind, and adds a layer in every other case.
 *
 * One rule for both kinds, which is what makes laying leaves feel like
 * printing tiles: tapping teak with a teak leaf selected swaps the leaf, and
 * tapping a tile with a leaf selected starts a tile rather than turning the
 * leaf into one. Kinds cannot replace each other because their layers are not
 * the same shape — a tile has an offset and a motif has a place.
 */
import type { Design, Layer, PatternKind } from '@/catalog'

/**
 * The layer a tap on a pattern would change, or `undefined` when the tap
 * should add one instead.
 *
 * @param kind the kind of pattern being tapped. Left out, this answers with
 * the selected layer whatever kind it is — which is what the panel needs to
 * say *that* something is selected, as opposed to what a tap would do to it.
 */
export function replaceableLayer(
  design: Design,
  selectedLayerId: string | null,
  printAreaId: string,
  kind?: PatternKind,
): Layer | undefined {
  const layer = design.layers.find((entry) => entry.id === selectedLayerId)

  if (layer === undefined) return undefined
  if (layer.printAreaId !== printAreaId) return undefined
  if (kind !== undefined && layer.type !== kind) return undefined

  return layer
}
