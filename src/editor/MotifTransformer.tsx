/**
 * The handles around the selected leaf: move, scale, turn.
 *
 * Corner anchors only, so a leaf can never be squashed out of shape — a motif
 * is a photograph of a real leaf and a stretched one looks like a mistake
 * rather than a choice. Rotation snaps to every 45° with a small tolerance, so
 * "straight" and "on the diagonal" are easy to hit and anything between them
 * is still free.
 *
 * Sized for a thumb: anchors are 24px of drawn square with another 20px of
 * invisible hit area around them, which is the 44px target CLAUDE.md asks for
 * without 44px of ink sitting on top of the design. That is why the transformer
 * lives at the root of the layer rather than inside the group that scales
 * mockup units to the screen — in there, every one of those sizes would be
 * multiplied by the fit and the handles would be thumb-sized only by accident.
 * Being outside the print area's clip also means the handles stay visible on a
 * leaf laid over the hem, where the leaf itself is trimmed.
 *
 * It finds its node by the layer id rather than being handed a ref, because the
 * node appears on the stage only once the leaf's image has decoded — which is
 * a render of the leaf, not of this component, so there is nothing here to
 * depend on. Instead it syncs on selection and again on every draw of the
 * layer: the draw that first puts the leaf on the stage is the one that lets
 * the handles find it. Each sync compares first, so the common case does
 * nothing at all and a redraw cannot interrupt a gesture in progress.
 */
import { useEffect, useRef } from 'react'
import Konva from 'konva'
import { Transformer } from 'react-konva'
import { ANNOTATION } from './stageExport'

/** `--color-forest-600`: the ink selection is drawn in everywhere else. */
const SELECTION_INK = '#4a7c3f'

/** Drawn square per anchor, in stage pixels. */
const ANCHOR_SIZE = 24

/** Invisible hit area added around each anchor, so the target is ~44px. */
const ANCHOR_HIT_PADDING = 20

/**
 * How far the handles stand off the leaf they hold, in stage pixels.
 *
 * Without it the anchors sit on the corners of the leaf's own box, and a leaf
 * laid in a small print area is smaller than the four anchors holding it: on a
 * Pixel 7 a quarter of the shawl's cloth is about 25px across, which four 24px
 * anchors cover completely. Standing them off leaves the leaf visible between
 * them at every size, without shrinking a touch target or growing the leaf.
 */
const HANDLE_PADDING = 12

/** Every 45°, which is how a leaf is usually laid. */
const ROTATION_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315]

/** How close to a snap a turn has to get, in degrees. */
const ROTATION_SNAP_TOLERANCE = 7

/** The smallest a leaf may be dragged to on screen, in stage pixels. */
const MIN_SIZE = 16

/** Konva's own name for the event a layer fires once it has painted. */
const DRAW_EVENT = 'draw'

/** Namespaces the listener, so only this one is taken off again. */
const NAMESPACE = 'motif-transformer'

export function MotifTransformer({
  selectedId,
}: {
  selectedId: string | null
}) {
  const transformer = useRef<Konva.Transformer>(null)

  useEffect(() => {
    const handles = transformer.current
    if (handles === null) return

    const layer = handles.getLayer()
    if (layer === null) return

    const sync = () => {
      const stage = handles.getStage()
      const node =
        selectedId === null || stage === null
          ? undefined
          : stage.findOne(`#${selectedId}`)
      const attached = handles.nodes()[0] ?? undefined

      if (attached === node) return

      handles.nodes(node === undefined ? [] : [node])
      // Attaching is an imperative change react-konva knows nothing about, so
      // nothing would repaint until the next thing that does: without this the
      // handles would appear on the following interaction, not on selection.
      // The redraw this asks for syncs once more and finds nothing to do.
      layer.batchDraw()
    }

    sync()
    layer.on(`${DRAW_EVENT}.${NAMESPACE}`, sync)

    return () => {
      layer.off(`${DRAW_EVENT}.${NAMESPACE}`)
    }
  }, [selectedId])

  return (
    <Transformer
      ref={transformer}
      // The handles say which leaf is selected, which is a thing about the
      // editor rather than about the cloth — so they come off for an export.
      name={ANNOTATION}
      keepRatio
      flipEnabled={false}
      enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
      padding={HANDLE_PADDING}
      rotationSnaps={ROTATION_SNAPS}
      rotationSnapTolerance={ROTATION_SNAP_TOLERANCE}
      anchorSize={ANCHOR_SIZE}
      anchorCornerRadius={ANCHOR_SIZE / 2}
      anchorStroke={SELECTION_INK}
      anchorStrokeWidth={2}
      anchorFill="#ffffff"
      borderStroke={SELECTION_INK}
      borderStrokeWidth={2}
      borderDash={[8, 6]}
      anchorStyleFunc={(anchor) => {
        // Konva gives an anchor the hit area of its own rectangle; this is the
        // ring around it that makes the target big enough for a thumb.
        anchor.hitStrokeWidth(ANCHOR_HIT_PADDING)
      }}
      boundBoxFunc={(oldBox, newBox) =>
        Math.abs(newBox.width) < MIN_SIZE || Math.abs(newBox.height) < MIN_SIZE
          ? oldBox
          : newBox
      }
    />
  )
}
