/**
 * Draws one layer of the design, inside the clipped group of its print area.
 *
 * Both kinds are real now, and both come from the same image: the pattern's
 * SVG is tinted with the layer's leaf-dye colours and rasterised once (see
 * `usePaintedPattern`). What differs is what is done with it. A tile is a
 * repeating surface pattern, so it becomes the *fill* of a rectangle covering
 * the whole mockup and the clip decides how much shows (`tileFill.ts`). A
 * motif is one leaf laid on the cloth, so it is a single image centred on the
 * layer's own point and turned around it (`motifBox.ts`).
 *
 * The pattern a layer names is looked up in the catalog here rather than
 * passed in, so nothing above this file has to know that a layer needs an
 * asset at all. A layer naming a pattern the catalog does not have draws
 * nothing: a design can outlive a pattern being renamed, and a blank print
 * area says that more clearly than a block of fallback colour would.
 *
 * Coordinates are mockup coordinates: the group above applies the fit.
 */
import { Image as KonvaImage, Rect } from 'react-konva'
import {
  useCatalog,
  type Layer,
  type MotifLayer,
  type Pattern,
  type ProductMockup,
  type TileLayer,
} from '@/catalog'
import { motifBox } from './motifBox'
import { tileFill } from './tileFill'
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

  return (
    <Rect
      {...tileFill(layer, mockup, painted.ratio)}
      fillPatternImage={painted.image}
    />
  )
}

/** One leaf, centred on the layer's point and turned around it. */
function MotifLayerView({
  layer,
  pattern,
}: {
  layer: MotifLayer
  pattern: Pattern
}) {
  const painted = usePaintedPattern(pattern.src, layer.colors)

  if (painted === null) return null

  // The box is in mockup units and the image may have been rasterised at
  // several times its natural size; Konva scales the bitmap into the box, so
  // the extra pixels come out as sharpness rather than as a bigger leaf.
  return (
    <KonvaImage image={painted.image} {...motifBox(layer, painted.aspect)} />
  )
}

export function LayerRenderer({
  layer,
  mockup,
}: {
  layer: Layer
  mockup: ProductMockup
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
    <MotifLayerView layer={layer} pattern={pattern} />
  )
}
