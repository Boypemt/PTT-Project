/**
 * The rectangle a print area fits inside, in mockup coordinates.
 *
 * Placing and dragging a motif needs a box to keep its centre within, and a
 * print area is either a rectangle — which already is one — or an SVG path:
 * the plate's round face, the wrap cloth's diamond, the shirt's front. For
 * those the answer is the path's bounding box rather than the path itself, so
 * a leaf may sit near a curved edge and have the group's clip trim whatever
 * hangs over. That is what laying a leaf near the hem of real cloth does, and
 * a clamp to the exact outline would instead refuse to put a leaf anywhere but
 * the middle.
 *
 * A path is measured by walking it: Konva parses the `d` string and answers
 * with a point at any distance along it, and the box is the extent of enough
 * points to lose nothing that matters. That is Konva's own parser rather than a
 * second implementation of arcs and béziers here, and only its static,
 * canvas-free half — building a `Konva.Path` node would need a 2D context,
 * which jsdom has none of, so this would stop being unit-testable.
 *
 * `SAMPLES` is why that is exact enough: on the largest outline in the catalog
 * the points are ~8 units apart along the curve, and a curve of that radius
 * bulges less than 1/40 of a mockup unit between two of them — a leaf's centre
 * is clamped to the pixel either way. The two round areas come out identical to
 * Konva's own exact box.
 */
import Konva from 'konva'
import type { PrintAreaClip } from '@/catalog'
import type { Rect } from '@/lib/geometry'

/** Points taken along a path. See the note above on the error this leaves. */
const SAMPLES = 256

/** A box for a clip that cannot be measured, which puts motifs at the origin. */
const EMPTY_BOUNDS: Rect = { x: 0, y: 0, width: 0, height: 0 }

/**
 * Bounding box per path. A path's box never changes, and this is asked for on
 * every frame of a drag — `dragBoundFunc` runs per pointer move — so measuring
 * once per outline is the point of the cache. Keyed by the `d` string, so two
 * products sharing an outline share the measurement.
 */
const measured = new Map<string, Rect>()

/** Drops every measured path. For tests, as the image caches have. */
export function resetAreaBounds(): void {
  measured.clear()
}

function measurePath(d: string): Rect {
  const data = Konva.Path.parsePathData(d)
  const length = Konva.Path.getPathLength(data)

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (let step = 0; step <= SAMPLES; step += 1) {
    const point = Konva.Path.getPointAtLengthOfDataArray(
      (length * step) / SAMPLES,
      data,
    )

    // `null` for an empty or unreadable path, which leaves the bounds untouched
    // and falls through to the guard below.
    if (point === null) continue

    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return EMPTY_BOUNDS

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function areaBounds(clip: PrintAreaClip): Rect {
  if (clip.type === 'rect') {
    const { x, y, width, height } = clip
    return { x, y, width, height }
  }

  const cached = measured.get(clip.d)
  if (cached !== undefined) return cached

  const rect = measurePath(clip.d)
  measured.set(clip.d, rect)

  return rect
}
