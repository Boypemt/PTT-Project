/**
 * Where a leaf lands when the visitor taps it, and how far it may be moved.
 *
 * Two decisions live here, and both are about the print area rather than about
 * the leaf:
 *
 * - A tapped motif arrives in the middle of the target area, its longer edge a
 *   quarter of the area's shorter side — but never below `MOTIF_MIN_SIZE`, and
 *   never above `MOTIF_MAX_RATIO` of that side. A quarter is small enough that
 *   the next tap has somewhere to go (laying leaves is a repeated action, not
 *   a single one) and measuring against the *shorter* side means a leaf never
 *   arrives already overflowing a narrow area like the shawl's end band. The
 *   floor is there because a quarter of a small area is a speck: on the
 *   handkerchief's corner it came out at 58 units, which is 16px on a Pixel 7
 *   — smaller than the handles holding it. The ceiling is what stops the floor
 *   from overflowing an area smaller still, so it wins where the two disagree.
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
import { clamp, clampPointToRect, type Point, type Rect } from '@/lib/geometry'
import { areaBounds } from './areaBounds'
import { clampMotifScale, MOTIF_UNIT } from './motifBox'

/** A new motif's longer edge, as a fraction of the area's shorter side. */
export const MOTIF_PLACE_RATIO = 0.25

/** No leaf is laid smaller than this, in mockup units — unless it cannot fit. */
export const MOTIF_MIN_SIZE = 100

/** And none larger than this much of the area's shorter side. */
export const MOTIF_MAX_RATIO = 0.6

export type MotifPlacement = { x: number; y: number; scale: number }

/** How long a leaf's longer edge may be in this area, in mockup units. */
export type MotifSizeBounds = { min: number; max: number }

/**
 * The sizes a leaf may be laid at in `bounds`.
 *
 * Shared with the scatter, so a handful of leaves thrown at an area are the
 * same sizes a tap would put there — one rule, and a scatter that looks like
 * the thing you get by tapping several times.
 *
 * `min` gives way where the area cannot hold it, so a print area smaller than
 * `MOTIF_MIN_SIZE` still gets a leaf that fits in it rather than one that
 * swamps it.
 */
export function motifSizeBounds(bounds: Rect): MotifSizeBounds {
  const shorter = Math.min(bounds.width, bounds.height)
  const max = MOTIF_MAX_RATIO * shorter

  return { min: Math.min(MOTIF_MIN_SIZE, max), max }
}

/** Mockup units along the longer edge → the `scale` a layer stores. */
export function scaleForSize(size: number): number {
  return clampMotifScale(size / MOTIF_UNIT)
}

/** The centre of `bounds`, at the size a tap lays a leaf. */
export function motifPlacement(bounds: Rect): MotifPlacement {
  const shorter = Math.min(bounds.width, bounds.height)
  const { min, max } = motifSizeBounds(bounds)

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    scale: scaleForSize(clamp(MOTIF_PLACE_RATIO * shorter, min, max)),
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
 * How far a duplicate sits from the leaf it was copied from, as a fraction of
 * that leaf's own longer edge. Relative rather than fixed, so the copy is
 * visibly beside the original whether the leaf is small or large.
 */
export const MOTIF_DUPLICATE_OFFSET = 0.25

/**
 * A copy of `layer`, laid a little down and to the right of it.
 *
 * On top of the original it would look like nothing had happened, so the copy
 * is nudged — and clamped, because the original may already be in the corner
 * of its area. Colours are copied rather than shared, so changing the dye on
 * one leaf cannot reach the other.
 */
export function duplicateMotif(
  layer: MotifLayer,
  bounds: Rect,
): Omit<MotifLayer, 'id'> {
  const step = MOTIF_DUPLICATE_OFFSET * layer.scale * MOTIF_UNIT
  const center = clampMotifCenter(
    { x: layer.x + step, y: layer.y + step },
    bounds,
  )

  return {
    type: 'motif',
    patternId: layer.patternId,
    printAreaId: layer.printAreaId,
    ...center,
    scale: layer.scale,
    rotation: layer.rotation,
    colors: [...layer.colors],
    opacity: layer.opacity,
  }
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
