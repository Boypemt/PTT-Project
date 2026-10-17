/**
 * One leaf on the stage, and the hands-on half of the editor: the only node a
 * tap can reach.
 *
 * A motif is directly manipulated rather than selected and then moved — on a
 * phone, "tap to select, then drag" costs a gesture nobody expects — so every
 * leaf is draggable, and the touch that starts a drag selects it on the way
 * down. Tiles stay out of reach entirely (`listening={false}` where they are
 * drawn): a tile is a repeating surface with no position of its own, and a
 * rectangle covering the whole mockup would also swallow every tap meant for
 * the cloth underneath.
 *
 * Two things are written back to the store, and only when a gesture ends:
 * where the leaf is and how it is scaled and turned. Konva moves the node
 * itself during a drag at 60fps; the store hears about it once, which keeps
 * undo in task 11 to one entry per gesture rather than one per frame.
 *
 * `dragBoundFunc` is what keeps a leaf inside its area *while* the finger
 * moves — clamping only at the end would let it visibly leave the cloth and
 * snap back. It converts the pointer into mockup units, clamps there and
 * converts back, so the rule is the same one the store applies and is written
 * in the units the design is saved in.
 */
import { useRef } from 'react'
import type Konva from 'konva'
import { Image as KonvaImage } from 'react-konva'
import type { MotifLayer, Pattern } from '@/catalog'
import {
  toMockupPoint,
  toStagePoint,
  type Fit,
  type Rect,
} from '@/lib/geometry'
import { clampMotifScale, motifBox, normalizeRotation } from './motifBox'
import { clampMotifCenter } from './motifPlacement'
import { usePaintedPattern } from './usePaintedPattern'

/** What a motif layer may change about itself on the canvas. */
export type MotifTransform = Pick<MotifLayer, 'x' | 'y' | 'scale' | 'rotation'>

/**
 * What a motif needs to be handled. Absent — a canvas that is only being
 * looked at — the leaf is drawn and nothing more.
 */
export type MotifTools = {
  /** The box the motif's centre is kept inside, in mockup units. */
  bounds: Rect
  /** How mockup units sit on the stage, for the clamp during a drag. */
  fit: Fit
  onSelect: () => void
  onCommit: (transform: MotifTransform) => void
}

export function MotifImage({
  layer,
  pattern,
  tools,
}: {
  layer: MotifLayer
  pattern: Pattern
  tools?: MotifTools
}) {
  const node = useRef<Konva.Image>(null)
  const painted = usePaintedPattern(pattern, layer.colors)

  if (painted === null) return null

  // The box is in mockup units and the image may have been rasterised at
  // several times its natural size; Konva scales the bitmap into the box, so
  // the extra pixels come out as sharpness rather than as a bigger leaf.
  const box = motifBox(layer, painted.aspect)

  if (tools === undefined) {
    return <KonvaImage image={painted.image} {...box} listening={false} />
  }

  const { bounds, fit, onSelect, onCommit } = tools

  /**
   * The gesture, read off the node and written to the store.
   *
   * A transform handle scales the *node*, not the layer, so the factor is
   * folded into the layer's own scale and the node is put back to 1 — the next
   * render then sets its width and height from the new scale, and the two
   * never drift apart. Scaling from a corner moves the centre as well, and a
   * handle is not a drag, so the centre is clamped here too.
   */
  const commit = () => {
    const image = node.current
    if (image === null) return

    const factor = (Math.abs(image.scaleX()) + Math.abs(image.scaleY())) / 2
    image.scaleX(1)
    image.scaleY(1)

    onCommit({
      ...clampMotifCenter(image.position(), bounds),
      scale: clampMotifScale(layer.scale * factor),
      rotation: normalizeRotation(image.rotation()),
    })
  }

  return (
    <KonvaImage
      ref={node}
      // The transformer finds the node it is attached to by this id.
      id={layer.id}
      image={painted.image}
      {...box}
      draggable
      dragBoundFunc={(position) =>
        toStagePoint(
          clampMotifCenter(toMockupPoint(position, fit), bounds),
          fit,
        )
      }
      // On the way down rather than on click: the handles have to be under the
      // thumb before it starts moving, and a click arrives after the drag.
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={commit}
      onTransformEnd={commit}
    />
  )
}
