/**
 * Draws one layer of the design, inside the clipped group of its print area.
 *
 * Every layer is a flat translucent rectangle for now, whichever kind it is:
 * this PR is about the stage and the clipping, and a rectangle is the
 * clearest thing to see a clip shape through. The switch is here so the two
 * real renderers have somewhere to land — the repeating pattern fill in task
 * 08, the placeable motif with its transform handles in task 09.
 *
 * Coordinates are mockup coordinates: the group above applies the fit.
 */
import { Rect } from 'react-konva'
import type { Layer, ProductMockup } from '@/catalog'

/** `--color-teak-pink`, for a layer that carries no colour of its own. */
const FALLBACK_COLOR = '#a23b62'

/** A motif's side at scale 1, in mockup units. */
const MOTIF_SIZE = 220

export function LayerRenderer({
  layer,
  mockup,
}: {
  layer: Layer
  mockup: ProductMockup
}) {
  const fill = layer.colors[0] ?? FALLBACK_COLOR

  // A tile covers its whole print area, so the stub covers the mockup and
  // lets the clip decide what shows — which is exactly what is being checked.
  if (layer.type === 'tile') {
    return (
      <Rect
        x={layer.offsetX}
        y={layer.offsetY}
        width={mockup.width}
        height={mockup.height}
        rotation={layer.rotation}
        fill={fill}
        opacity={layer.opacity}
      />
    )
  }

  const size = MOTIF_SIZE * layer.scale

  // A motif sits at a point, so the stub is centred on it and turns around it.
  return (
    <Rect
      x={layer.x}
      y={layer.y}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
      rotation={layer.rotation}
      fill={fill}
      opacity={layer.opacity}
    />
  )
}
