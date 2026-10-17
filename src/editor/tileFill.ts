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

/**
 * Mockup units per natural pixel of the tile: what turns the asset's own size
 * into the size the pattern is printed at.
 *
 * A pattern with a `repeatUnits` is measured in the mockup's units — one
 * repeat across that many of them, whatever the file's pixel size — so a
 * photograph exported at 1600 px and the same pattern re-exported at 2400 px
 * print identically, and a designer picks the size by what it should look like
 * on cloth rather than by a number in an export dialog. Without one the tile
 * prints at its own pixel size, which is what the drawn SVGs were made for and
 * what every design saved so far means by `scale` 1.
 *
 * @param naturalWidth the asset's width in natural pixels. Zero — an image
 * that has not decoded — leaves the pattern at its own size rather than
 * collapsing it.
 */
export function tileUnitScale(
  repeatUnits: number | undefined,
  naturalWidth: number,
): number {
  if (repeatUnits === undefined || naturalWidth <= 0) return 1

  return repeatUnits / naturalWidth
}

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
 * meaning one repeat, however many pixels it was rasterised at.
 * @param units mockup units per natural pixel, from `tileUnitScale`. One — the
 * default — is a tile printed at its own pixel size.
 */
export function tileFill(
  layer: TileLayer,
  mockup: ProductMockup,
  ratio: number,
  units = 1,
): TileFillProps {
  const scale =
    (Math.max(layer.scale, MIN_SCALE) * Math.max(units, MIN_SCALE)) /
    Math.max(ratio, MIN_SCALE)

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
