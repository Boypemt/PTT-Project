/**
 * The Konva props that lay a placement pattern into a print area.
 *
 * A placement pattern (`fit: "area"` in the catalog) is one picture that *is*
 * the print — a heart radiating out of the middle of a handkerchief, a few
 * circles across a shawl — rather than a surface that repeats. So it is sized
 * against the print area instead of against the mockup: at `scale` 1 it covers
 * the area's box exactly, which is the size the designer drew it at.
 *
 * Cover, not contain: a picture fitted *inside* the box would leave bare cloth
 * down two edges of every area whose proportions differ from the file's, and
 * the clip above this already trims whatever hangs over the outline. The
 * picture keeps its own proportions either way — a heart stretched to a
 * handkerchief is no longer the drawing that was delivered.
 *
 * `scale`, `rotation`, `offsetX` and `offsetY` are the same layer fields a
 * repeating tile uses and keep their meaning: bigger than the area, turned on
 * the cloth, moved in mockup units. The picture turns about its own centre,
 * which is why `offset` is half its size — Konva rotates a node about its
 * origin, and the origin has to be the middle of the drawing for "rotation"
 * to mean what the slider says.
 *
 * Everything here is in mockup coordinates, as `tileFill` is.
 */
import type { TileLayer } from '@/catalog'
import type { Rect } from '@/lib/geometry'

/** As in `tileFill`: a scale of zero or less would draw nothing at all. */
const MIN_SCALE = 0.01

export type AreaFillProps = {
  x: number
  y: number
  width: number
  height: number
  offsetX: number
  offsetY: number
  rotation: number
  opacity: number
}

/**
 * @param bounds the print area's box, from `areaBounds`.
 * @param aspect the asset's width divided by its height, from
 * `usePaintedPattern`. Anything unmeasurable is 1 there, which fills the box
 * with a square rather than with nothing.
 */
export function areaFill(
  layer: TileLayer,
  bounds: Rect,
  aspect: number,
): AreaFillProps {
  const safeAspect = aspect > 0 ? aspect : 1
  const boxAspect = bounds.height > 0 ? bounds.width / bounds.height : 1

  // The side that would come up short decides the size; the other overflows
  // and is clipped.
  const cover =
    safeAspect > boxAspect
      ? { width: bounds.height * safeAspect, height: bounds.height }
      : { width: bounds.width, height: bounds.width / safeAspect }

  const scale = Math.max(layer.scale, MIN_SCALE)
  const width = cover.width * scale
  const height = cover.height * scale

  return {
    x: bounds.x + bounds.width / 2 + layer.offsetX,
    y: bounds.y + bounds.height / 2 + layer.offsetY,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: layer.rotation,
    opacity: layer.opacity,
  }
}
