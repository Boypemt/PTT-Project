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
 *
 * The stage listens for taps only where there is something to take hold of,
 * which is leaf motifs and therefore the `motifs` flag: with it off this is
 * the picture it has always been, with nothing on it that answers a pointer.
 * With it on, every node but the motifs is still deaf — so a tap that reaches
 * the stage itself is a tap on empty cloth, and that is what clears the
 * selection.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import Konva from 'konva'
import { useTranslation } from 'react-i18next'
import {
  Group,
  Image as KonvaImage,
  Layer,
  Path,
  Rect,
  Stage,
} from 'react-konva'
import type { Layer as DesignLayer, PrintArea } from '@/catalog'
import type { PrintAreaClip, Product } from '@/catalog'
import { isEnabled } from '@/lib/flags'
import { fitContain, pixelRatio, type Fit } from '@/lib/geometry'
import { areaBounds } from './areaBounds'
import { clipFunc } from './clip'
import { LayerRenderer } from './LayerRenderer'
import type { MotifTools } from './MotifImage'
import { MotifTransformer } from './MotifTransformer'
import { buildScene } from './scene'
import { useDesignFor, useDesignStore } from './useDesignStore'
import { useMotifKeyboard } from './useMotifKeyboard'
import { useImage } from './useImage'
import { useMeasuredSize } from './useMeasuredSize'

// Konva reads this when it builds any canvas — the stage's and every cached
// node's. Capping it here is the one place that decides how many device
// pixels a phone redraws per frame.
Konva.pixelRatio = pixelRatio(globalThis.devicePixelRatio)

/** `--color-paper-100`: the surface the DOM mockup sat on. */
const PAPER = '#faf6ec'

/** `--color-teak-pink`: the print-area ink, as on /dev/catalog. */
const PRINT_AREA_INK = '#a23b62'

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
    <Group ref={group} x={fit.offsetX} y={fit.offsetY} listening={false}>
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
      listening={false}
    />
  )
}

/** A group whose children are drawn in the catalog's mockup coordinates. */
function MockupSpace({ fit, children }: { fit: Fit; children: ReactNode }) {
  return (
    <Group
      x={fit.offsetX}
      y={fit.offsetY}
      scaleX={fit.scale}
      scaleY={fit.scale}
    >
      {children}
    </Group>
  )
}

/**
 * Where a pattern is allowed to print, dashed over the mockup — the same ink
 * and dashes /dev/catalog draws, so one look means the same thing on both.
 *
 * Drawn above the shading, as it is there, because it is an annotation rather
 * than something printed on the cloth.
 */
function PrintAreaOutline({ clip }: { clip: PrintAreaClip }) {
  const stroke = {
    stroke: PRINT_AREA_INK,
    strokeWidth: 4,
    dash: [16, 12],
    // An annotation, so it never stands between a tap and a leaf.
    listening: false,
  }

  return clip.type === 'rect' ? (
    <Rect
      x={clip.x}
      y={clip.y}
      width={clip.width}
      height={clip.height}
      {...stroke}
    />
  ) : (
    <Path data={clip.d} {...stroke} />
  )
}

export function EditorCanvas({ product }: { product: Product }) {
  const { t } = useTranslation()
  const [containerRef, size] = useMeasuredSize<HTMLDivElement>()
  const onKeyDown = useMotifKeyboard(product)
  const design = useDesignFor(product)
  const showPrintAreas = useDesignStore((state) => state.showPrintAreas)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
  const selectLayer = useDesignStore((state) => state.selectLayer)
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const { mockup } = product
  const fit = fitContain(mockup, size)
  const scene = buildScene(product, design)
  const handles = isEnabled('motifs')

  /** What one motif layer may do to itself; see `MotifImage`. */
  const motifTools = (area: PrintArea, layer: DesignLayer): MotifTools => ({
    bounds: areaBounds(area.clip),
    fit,
    onSelect: () => {
      selectLayer(layer.id)
    },
    onCommit: (transform) => {
      updateLayer(layer.id, transform)
    },
  })

  /**
   * A tap that reached the stage itself touched nothing: every node but the
   * motifs is `listening={false}`, so this is empty cloth and the selection
   * goes. Taken on the way down, as selecting a leaf is, so the two cannot
   * disagree about which came first.
   */
  const clearSelection = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (event.target === event.target.getStage()) selectLayer(null)
  }

  return (
    <div
      ref={containerRef}
      className="min-h-0 min-w-0 flex-1 outline-forest-600 focus-visible:outline-2"
      // Focusable only where there is something to handle, so a build without
      // motifs has the same tab order it has always had. `application` is what
      // tells a screen reader to pass the arrow keys through to the editor
      // rather than move its own cursor with them.
      {...(handles
        ? {
            role: 'application',
            tabIndex: 0,
            'aria-label': t('customize.canvas'),
            onKeyDown,
          }
        : {})}
    >
      {/* Nothing to draw until the box has been measured, and a zero-sized
          stage is an error in Konva rather than an empty picture. */}
      {fit.scale > 0 ? (
        <Stage
          width={size.width}
          height={size.height}
          // Both handlers are attached either way; with nothing to take hold
          // of, `listening` is what stops Konva dispatching to them at all.
          listening={handles}
          onMouseDown={clearSelection}
          onTouchStart={clearSelection}
        >
          <Layer listening={handles}>
            {/* The paper the DOM mockup sat on. `multiply` needs something
                opaque underneath, or the shading would darken transparency
                and come out heavier than it does on /products. */}
            <Rect
              x={fit.offsetX}
              y={fit.offsetY}
              width={fit.width}
              height={fit.height}
              fill={PAPER}
              listening={false}
            />

            <TintedBase src={mockup.base} color={design.baseColor} fit={fit} />

            <MockupSpace fit={fit}>
              {scene.areas.map(({ area, layers }) => (
                <Group key={area.id} clipFunc={clipFunc(area.clip)}>
                  {layers.map((layer) => (
                    <LayerRenderer
                      key={layer.id}
                      layer={layer}
                      mockup={mockup}
                      motif={handles ? motifTools(area, layer) : undefined}
                    />
                  ))}
                </Group>
              ))}
            </MockupSpace>

            {mockup.overlay === undefined ? null : (
              <Shading src={mockup.overlay} fit={fit} />
            )}

            {showPrintAreas ? (
              <MockupSpace fit={fit}>
                {scene.areas.map(({ area }) => (
                  <PrintAreaOutline key={area.id} clip={area.clip} />
                ))}
              </MockupSpace>
            ) : null}

            {/* Last, so the handles are drawn over the design, and outside
                `MockupSpace`, so they are sized in screen pixels. */}
            {handles ? <MotifTransformer selectedId={selectedLayerId} /> : null}
          </Layer>
        </Stage>
      ) : null}
    </div>
  )
}
