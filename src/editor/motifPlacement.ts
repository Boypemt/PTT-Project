/**
 * Where a leaf lands when the visitor taps it, and how far it may be moved.
 *
 * Two decisions live here, and both are about the print area rather than about
 * the leaf:
 *
 * - A tapped motif arrives in the middle of the target area at a quarter of
 *   the area's shorter side. A quarter is small enough that the next tap has
 *   somewhere to go — laying leaves is a repeated action, not a single one —
 *   and large enough to grab a transform handle on at phone width. Measuring
 *   against the *shorter* side means one leaf never arrives already overflowing
 *   a narrow area like the shawl's end band.
 * - What is kept inside the area is the motif's **centre**, not its whole box.
 *   A leaf is allowed to hang over the edge and be trimmed by the clip, which
 *   is what laying a leaf near the hem of real cloth does; clamping the box
 *   would push every large leaf to the middle and make the corner of a
 *   handkerchief unusable.
 *
 * Both are applied in mockup coordinates, so they are the same whatever size
 * the stage is.
 */
import type { MotifLayer, Pattern, PrintArea } from '@/catalog'
import { clampPointToRect, type Point, type Rect } from '@/lib/geometry'
import { areaBounds } from './areaBounds'
import { clampMotifScale, MOTIF_UNIT } from './motifBox'

/** A new motif's longer edge, as a fraction of the area's shorter side. */
export const MOTIF_PLACE_RATIO = 0.25

export type MotifPlacement = { x: number; y: number; scale: number }

/** The centre of `bounds`, at a scale a quarter of its shorter side. */
export function motifPlacement(bounds: Rect): MotifPlacement {
  const shorter = Math.min(bounds.width, bounds.height)

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    scale: clampMotifScale((MOTIF_PLACE_RATIO * shorter) / MOTIF_UNIT),
  }
}

/**
 * Keeps a motif's centre inside its print area.
 *
 * Used twice over: `dragBoundFunc` calls it on every pointer move, so a leaf
 * never visibly leaves its area and snaps back afterwards, and the store write
 * calls it again — a transform handle can move a motif without a drag, and a
 * hand-edited share link can name any point at all.
 */
export function clampMotifCenter(center: Point, bounds: Rect): Point {
  return clampPointToRect(center, bounds)
}

/**
 * The motif layer a tap on `pattern` adds to `area`.
 *
 * Colours are copied out of the catalog entry, as a tile's are, so the layer
 * cannot write back into the loaded catalog.
 */
export function newMotifLayer(
  pattern: Pattern,
  area: PrintArea,
): Omit<MotifLayer, 'id'> {
  const { x, y, scale } = motifPlacement(areaBounds(area.clip))

  return {
    type: 'motif',
    patternId: pattern.id,
    printAreaId: area.id,
    x,
    y,
    scale,
    rotation: 0,
    colors: [...pattern.defaultColors],
    opacity: 1,
  }
}
