/**
 * The editor's canvas: the product mockup with the visitor's design on it.
 *
 * It paints what `ProductMockup` paints in the DOM — a silhouette filled with
 * the base colour, shading multiplied over it — but on a Konva stage, because
 * the pattern layers that arrive in task 08 need a surface that can be
 * clipped, dragged and exported as a PNG.
 *
 * Everything inside the stage is positioned through one `Fit` (see
 * `src/lib/geometry.ts`): the stage fills the box the layout gives it, and the
 * mockup sits centred inside, as large as it goes. Print areas and layers are
 * written in mockup coordinates and reach the screen through the same fit, so
 * nothing in the catalog has to know how big the browser window is.
 *
 * `ProductMockup` stays in use on /products and /dev/catalog, where a still
 * picture is all those pages need.
 */
import { useEffect, useRef } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage, Layer, Rect, Stage } from 'react-konva'
import type { Product } from '@/catalog'
import { fitContain, pixelRatio, type Fit } from '@/lib/geometry'
import { clipFunc } from './clip'
import { LayerRenderer } from './LayerRenderer'
import { buildScene } from './scene'
import { useDesignFor } from './useDesignStore'
import { useImage } from './useImage'
import { useMeasuredSize } from './useMeasuredSize'

// Konva reads this when it builds any canvas — the stage's and every cached
// node's. Capping it here is the one place that decides how many device
// pixels a phone redraws per frame.
Konva.pixelRatio = pixelRatio(globalThis.devicePixelRatio)

/** `--color-paper-100`: the surface the DOM mockup sat on. */
const PAPER = '#faf6ec'

/**
 * The silhouette, filled with the base colour.
 *
 * `source-in` keeps the fill only where the silhouette is opaque — the canvas
 * equivalent of the CSS mask `ProductMockup` uses. It needs a surface of its
 * own, or it would erase everything already on the layer, so the group is
 * cached: that gives Konva an offscreen canvas holding just these two nodes.
 */
function TintedBase({
  src,
  color,
  fit,
}: {
  src: string
  color: string
  fit: Fit
}) {
  const { status, image } = useImage(src)
  const group = useRef<Konva.Group>(null)

  useEffect(() => {
    const node = group.current
    if (node === null) return

    node.cache({ x: 0, y: 0, width: fit.width, height: fit.height })

    return () => {
      node.clearCache()
    }
    // Re-cached whenever the picture inside it changes: a stale cache would
    // keep showing the previous colour or the previous size.
  }, [status, color, fit.width, fit.height])

  if (status !== 'loaded') return null

  return (
    <Group ref={group} x={fit.offsetX} y={fit.offsetY}>
      <KonvaImage image={image} width={fit.width} height={fit.height} />
      <Rect
        width={fit.width}
        height={fit.height}
        fill={color}
        globalCompositeOperation="source-in"
      />
    </Group>
  )
}

/** Folds and shading, multiplied over the colour and the pattern. */
function Shading({ src, fit }: { src: string; fit: Fit }) {
  const { status, image } = useImage(src)

  if (status !== 'loaded') return null

  return (
    <KonvaImage
      image={image}
      x={fit.offsetX}
      y={fit.offsetY}
      width={fit.width}
      height={fit.height}
      globalCompositeOperation="multiply"
    />
  )
}

export function EditorCanvas({ product }: { product: Product }) {
  const [containerRef, size] = useMeasuredSize<HTMLDivElement>()
  const design = useDesignFor(product)
  const { mockup } = product
  const fit = fitContain(mockup, size)
  const scene = buildScene(product, design)

  return (
    <div ref={containerRef} className="min-h-0 min-w-0 flex-1">
      {/* Nothing to draw until the box has been measured, and a zero-sized
          stage is an error in Konva rather than an empty picture. */}
      {fit.scale > 0 ? (
        <Stage width={size.width} height={size.height} listening={false}>
          <Layer listening={false}>
            {/* The paper the DOM mockup sat on. `multiply` needs something
                opaque underneath, or the shading would darken transparency
                and come out heavier than it does on /products. */}
            <Rect
              x={fit.offsetX}
              y={fit.offsetY}
              width={fit.width}
              height={fit.height}
              fill={PAPER}
            />

            <TintedBase src={mockup.base} color={design.baseColor} fit={fit} />

            {/* Inside this group the coordinates are the catalog's own, so a
                print area's clip and a layer's position are written once in
                mockup space and never converted. */}
            <Group
              x={fit.offsetX}
              y={fit.offsetY}
              scaleX={fit.scale}
              scaleY={fit.scale}
            >
              {scene.areas.map(({ area, layers }) => (
                <Group key={area.id} clipFunc={clipFunc(area.clip)}>
                  {layers.map((layer) => (
                    <LayerRenderer
                      key={layer.id}
                      layer={layer}
                      mockup={mockup}
                    />
                  ))}
                </Group>
              ))}
            </Group>

            {mockup.overlay === undefined ? null : (
              <Shading src={mockup.overlay} fit={fit} />
            )}
          </Layer>
        </Stage>
      ) : null}
    </div>
  )
}
