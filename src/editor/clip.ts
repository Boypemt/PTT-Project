/**
 * Turns a print area's clip into the function Konva clips a group with.
 *
 * A `PrintArea` says where on the mockup a pattern is allowed to show — the
 * cloth panel of a shawl, the face of a plate — as either a rectangle or an
 * SVG path, in mockup coordinates. Konva clips a `Container` by calling a
 * function with its drawing context: anything the function puts on the path
 * becomes the visible region, and returning `[path]` clips to a `Path2D`
 * instead, which is how an SVG `d` string gets in without being re-parsed by
 * hand.
 *
 * Konva runs the function inside the group's own transform, so the numbers
 * here stay in mockup coordinates and the fit's scale is applied for free.
 */
import type { PrintAreaClip } from '@/catalog'

/**
 * The slice of Konva's context a clip uses. Narrow on purpose: a plain object
 * satisfies it, so this module can be tested without a canvas.
 */
export type ClipContext = {
  rect(x: number, y: number, width: number, height: number): void
}

/** What Konva spreads into `context.clip()` once the function has run. */
export type ClipArgs = [Path2D] | undefined

export type ClipFunc = (ctx: ClipContext) => ClipArgs

export function clipFunc(clip: PrintAreaClip): ClipFunc {
  if (clip.type === 'rect') {
    const { x, y, width, height } = clip

    return (ctx) => {
      ctx.rect(x, y, width, height)
      return undefined
    }
  }

  const { d } = clip
  // Parsed on the first draw and kept: Konva calls this on every frame the
  // group is redrawn, and a `Path2D` is immutable once built.
  let path: Path2D | undefined

  return () => {
    path ??= new Path2D(d)
    return [path]
  }
}
