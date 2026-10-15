/**
 * How large a motif is drawn, and which way round it sits.
 *
 * A motif is a single leaf laid on the cloth, so unlike a tile it has a place
 * of its own: `x`/`y` is its centre in mockup coordinates and it turns around
 * that centre. What it does *not* carry is a size in pixels — the layer stores
 * a `scale`, and this file is the one place that says what a scale means.
 *
 * **Scale 1 is `MOTIF_UNIT` mockup units on the motif's longer edge.** The
 * shorter edge follows from the asset's own aspect ratio. That definition is
 * deliberately independent of how many pixels the SVG happens to be drawn at:
 * the seven placeholder leaves are all 400×400 and the designer's real ones
 * will not be, and a scale that meant "times the asset's natural size" would
 * silently resize every saved design the day a leaf is redrawn larger.
 *
 * `scale` is part of the saved design (see the domain model in
 * docs/PROJECT_BRIEF.md), which autosave and the share link in task 11 carry,
 * so `MOTIF_UNIT` is effectively part of that format. `motifBox.test.ts` pins
 * its value for that reason: changing the number re-scales every leaf in every
 * design anyone has already saved.
 *
 * Everything here is in mockup coordinates — the group above applies the fit.
 */
import type { MotifLayer } from '@/catalog'

/** Mockup units along a motif's longer edge at scale 1. */
export const MOTIF_UNIT = 220

/**
 * How far a motif may be scaled. The lower bound is a leaf still big enough
 * to grab a transform handle on; the upper one is a single leaf covering any
 * print area in the catalog several times over, which is as far as useful.
 */
export const MOTIF_SCALE = { min: 0.05, max: 4 } as const

/** The Konva props that draw one motif image. */
export type MotifBox = {
  x: number
  y: number
  width: number
  height: number
  offsetX: number
  offsetY: number
  rotation: number
  opacity: number
}

export function clampMotifScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1

  return Math.min(Math.max(scale, MOTIF_SCALE.min), MOTIF_SCALE.max)
}

/**
 * The same angle written as 0°–360°, which is what the rotation slider and the
 * transform handles both have to agree on. Konva hands back negative angles
 * once a motif has been turned anticlockwise.
 */
export function normalizeRotation(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0

  return ((degrees % 360) + 360) % 360
}

/**
 * A motif's drawn size.
 *
 * @param aspect the asset's width divided by its height. A ratio that has not
 * been measured yet — an image still decoding, a zero-sized SVG — is taken as
 * square, so a leaf is never drawn with no area at all.
 */
export function motifSize(
  scale: number,
  aspect: number,
): { width: number; height: number } {
  const longer = MOTIF_UNIT * clampMotifScale(scale)
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1

  return ratio >= 1
    ? { width: longer, height: longer / ratio }
    : { width: longer * ratio, height: longer }
}

/**
 * Where and how big Konva should draw `layer`.
 *
 * The offset is half the size on each axis, which is what makes `x`/`y` the
 * centre: Konva positions a node by its offset origin and rotates around it,
 * so one leaf turns on the spot instead of swinging away from the cloth.
 */
export function motifBox(layer: MotifLayer, aspect: number): MotifBox {
  const { width, height } = motifSize(layer.scale, aspect)

  return {
    x: layer.x,
    y: layer.y,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: normalizeRotation(layer.rotation),
    opacity: layer.opacity,
  }
}
