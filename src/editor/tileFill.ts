/**
 * The Konva props that print one tile layer across a print area.
 *
 * A tile is a repeating surface pattern, so the shape carrying it never moves:
 * it is a rectangle over the whole mockup, and the print area's clip decides
 * how much of it shows. Scale, rotation and offset act on the *fill* rather
 * than on the rectangle, through Konva's `fillPattern*` props. That is the
 * difference between a pattern and a sticker — a rotated rectangle would pull
 * its corners out of the print area and leave the cloth bare there, while a
 * rotated fill tiles the whole plane and cannot run out.
 *
 * Konva's pattern transform is
 *
 *     translate(fillPatternX, fillPatternY)
 *       · rotate(fillPatternRotation)
 *       · scale(fillPatternScale)
 *       · translate(-fillPatternOffset)
 *
 * so the offset goes through `fillPatternX/Y`, outside the rotation, and not
 * through `fillPatternOffset`, which sits inside it. Both move the fill, but
 * only the first keeps "offset X" meaning *to the right* once the pattern is
 * turned, and keeps the layer's numbers in mockup units — the same units the
 * share link will carry.
 *
 * Everything here is in mockup coordinates: the group above applies the fit,
 * so one unit is one unit of the catalog's mockup whatever size the stage is.
 */
import type { ProductMockup, TileLayer } from '@/catalog'

/**
 * The smallest pattern scale that still draws. A scale of zero collapses the
 * pattern transform and a negative one mirrors it into nothing; the sliders
 * cannot ask for either, but a hand-edited share link could.
 */
const MIN_SCALE = 0.01

export type TileFillProps = {
  x: number
  y: number
  width: number
  height: number
  fillPatternRepeat: 'repeat'
  fillPatternX: number
  fillPatternY: number
  fillPatternRotation: number
  fillPatternScaleX: number
  fillPatternScaleY: number
  opacity: number
}

/**
 * @param ratio image pixels per natural pixel of the tile, from
 * `usePatternImage`. Dividing the pattern scale by it keeps `layer.scale` 1
 * meaning the tile's natural size, however many pixels it was rasterised at.
 */
export function tileFill(
  layer: TileLayer,
  mockup: ProductMockup,
  ratio: number,
): TileFillProps {
  const scale = Math.max(layer.scale, MIN_SCALE) / Math.max(ratio, MIN_SCALE)

  return {
    x: 0,
    y: 0,
    width: mockup.width,
    height: mockup.height,
    fillPatternRepeat: 'repeat',
    fillPatternX: layer.offsetX,
    fillPatternY: layer.offsetY,
    fillPatternRotation: layer.rotation,
    fillPatternScaleX: scale,
    fillPatternScaleY: scale,
    opacity: layer.opacity,
  }
}
