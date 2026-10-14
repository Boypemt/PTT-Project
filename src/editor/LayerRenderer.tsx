/**
 * Draws one layer of the design, inside the clipped group of its print area.
 *
 * A tile layer is real from this task on: the pattern's SVG is rasterised and
 * repeated across the print area (see `tileFill.ts` for the geometry and
 * `usePatternImage.ts` for the raster). A motif is still the flat rectangle
 * stub — placing and transforming one is task 09.
 *
 * The pattern a layer names is looked up in the catalog here rather than
 * passed in, so nothing above this file has to know that a layer needs an
 * asset at all. A layer naming a pattern the catalog does not have draws
 * nothing: a design can outlive a pattern being renamed, and a blank print
 * area says that more clearly than a block of fallback colour would.
 *
 * Coordinates are mockup coordinates: the group above applies the fit.
 */
import { useState } from 'react'
import { Rect } from 'react-konva'
import {
  useCatalog,
  type Layer,
  type MotifLayer,
  type Pattern,
  type ProductMockup,
  type TileLayer,
} from '@/catalog'
import { tileFill } from './tileFill'
import { usePatternImage } from './usePatternImage'

/** `--color-teak-pink`, for a motif stub that carries no colour of its own. */
const FALLBACK_COLOR = '#a23b62'

/** A motif's side at scale 1, in mockup units. */
const MOTIF_SIZE = 220

/** What the stage is painting now: an image that has finished decoding. */
type Painted = { image: HTMLImageElement; ratio: number }

/** The still rectangle whose *fill* carries the tile. */
function PatternFill({
  layer,
  pattern,
  mockup,
}: {
  layer: TileLayer
  pattern: Pattern
  mockup: ProductMockup
}) {
  const { status, image, ratio } = usePatternImage(pattern.src, layer.colors)

  // Changing a colour builds a new image, and for the frame or two it takes to
  // decode there is nothing to paint. Keeping the last one that loaded carries
  // the cloth through a tap on a leaf-dye swatch instead of blinking. An
  // undecoded image paints nothing anyway, and a broken one makes Konva throw,
  // so this is also what keeps either off the stage.
  const [painted, setPainted] = useState<Painted | null>(null)

  // Adjusted during render rather than in an effect, so the new image is on
  // the stage in the same commit it became ready — React re-runs this
  // component before anything is shown, and the comparison stops it there.
  if (status === 'loaded' && painted?.image !== image) {
    setPainted({ image, ratio })
  }

  if (painted === null) return null

  return (
    <Rect
      {...tileFill(layer, mockup, painted.ratio)}
      fillPatternImage={painted.image}
    />
  )
}

function TileLayerView({
  layer,
  mockup,
}: {
  layer: TileLayer
  mockup: ProductMockup
}) {
  const { status, catalog } = useCatalog()

  // The canvas only renders behind `CatalogGate`, so this is ready; the guard
  // is here because the type says it might not be.
  if (status !== 'ready') return null

  const pattern = catalog.patterns.find((entry) => entry.id === layer.patternId)

  if (pattern === undefined) return null

  return <PatternFill layer={layer} pattern={pattern} mockup={mockup} />
}

/** A motif sits at a point, so the stub is centred on it and turns around it. */
function MotifLayerStub({ layer }: { layer: MotifLayer }) {
  const size = MOTIF_SIZE * layer.scale

  return (
    <Rect
      x={layer.x}
      y={layer.y}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
      rotation={layer.rotation}
      fill={layer.colors[0] ?? FALLBACK_COLOR}
      opacity={layer.opacity}
    />
  )
}

export function LayerRenderer({
  layer,
  mockup,
}: {
  layer: Layer
  mockup: ProductMockup
}) {
  return layer.type === 'tile' ? (
    <TileLayerView layer={layer} mockup={mockup} />
  ) : (
    <MotifLayerStub layer={layer} />
  )
}
