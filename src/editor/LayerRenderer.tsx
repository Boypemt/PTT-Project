/**
 * Draws one layer of the design, inside the clipped group of its print area.
 *
 * Both kinds are real now, and both come from the same image: the pattern's
 * SVG is tinted with the layer's leaf-dye colours and rasterised once (see
 * `usePaintedPattern`). What differs is what is done with it. A tile is a
 * repeating surface pattern, so it becomes the *fill* of a rectangle covering
 * the whole mockup and the clip decides how much shows (`tileFill.ts`). A
 * motif is one leaf laid on the cloth, so it is a single image centred on the
 * layer's own point, turned around it, and the one thing on the stage a tap
 * can take hold of (`MotifImage.tsx`).
 *
 * The pattern a layer names is looked up in the catalog here rather than
 * passed in, so nothing above this file has to know that a layer needs an
 * asset at all. A layer naming a pattern the catalog does not have draws
 * nothing: a design can outlive a pattern being renamed, and a blank print
 * area says that more clearly than a block of fallback colour would.
 *
 * Coordinates are mockup coordinates: the group above applies the fit.
 */
import { Rect } from 'react-konva'
import {
  useCatalog,
  type Layer,
  type Pattern,
  type ProductMockup,
  type TileLayer,
} from '@/catalog'
import { MotifImage, type MotifTools } from './MotifImage'
import { tileFill, tileUnitScale } from './tileFill'
import { usePaintedPattern } from './usePaintedPattern'

/** The still rectangle whose *fill* carries the tile. */
function TileLayerView({
  layer,
  pattern,
  mockup,
}: {
  layer: TileLayer
  pattern: Pattern
  mockup: ProductMockup
}) {
  const painted = usePaintedPattern(pattern.src, layer.colors)

  if (painted === null) return null

  // The asset's own width, the raster divided back out, is what the pattern's
  // repeat size is measured against.
  const units = tileUnitScale(
    pattern.repeatUnits,
    painted.image.naturalWidth / painted.ratio,
  )

  return (
    <Rect
      {...tileFill(layer, mockup, painted.ratio, units)}
      fillPatternImage={painted.image}
      // A tile has no position of its own to drag, and this rectangle covers
      // the whole mockup: left listening it would swallow every tap meant for
      // a leaf underneath or for the empty cloth.
      listening={false}
    />
  )
}

export function LayerRenderer({
  layer,
  mockup,
  motif,
}: {
  layer: Layer
  mockup: ProductMockup
  /** How a motif may be handled. Absent, it is drawn and nothing more. */
  motif?: MotifTools
}) {
  const { status, catalog } = useCatalog()

  // The canvas only renders behind `CatalogGate`, so this is ready; the guard
  // is here because the type says it might not be.
  if (status !== 'ready') return null

  const pattern = catalog.patterns.find((entry) => entry.id === layer.patternId)

  if (pattern === undefined) return null

  return layer.type === 'tile' ? (
    <TileLayerView layer={layer} pattern={pattern} mockup={mockup} />
  ) : (
    <MotifImage layer={layer} pattern={pattern} tools={motif} />
  )
}
