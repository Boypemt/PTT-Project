/**
 * How large to render a design, and which part of the stage to keep.
 *
 * The stage is whatever size the browser window left for it, with the mockup
 * centred inside and paper around it (see `fitContain` in `src/lib/geometry`).
 * A PNG of the stage would therefore be a PNG of the visitor's window — paper
 * margins included, and as wide as their phone. What a design is worth sending
 * to the community is the mockup and nothing else, at a size that survives
 * being looked at on something other than the phone it was made on.
 *
 * So two answers, both of them arithmetic on the fit, and both tested without
 * a canvas:
 *
 * - **Which part.** The mockup's own box on the stage, which is exactly what
 *   `Fit` describes. Konva crops to it.
 * - **How large.** Twice what is on screen, or the mockup's own coordinate
 *   space, whichever is bigger — a phone showing a 1000-unit shawl at 360px
 *   would otherwise export a 720px picture of a design drawn at 1000 — capped
 *   so nobody is sent a 12-megapixel PNG over mobile data.
 *
 * The cap is on the longer edge rather than the width, because a mockup is not
 * promised to be square. It is the same edge throughout: a fit preserves the
 * mockup's aspect ratio, so the mockup's longer edge and its longer edge on
 * screen are the same one.
 */
import type { Fit, Size } from '@/lib/geometry'

/**
 * The most pixels an exported design may have on its longer edge.
 *
 * Enough to print a handkerchief at arm's length or fill a laptop screen, and
 * small enough to send over LINE on a village connection — which is the whole
 * journey this export exists for.
 */
export const MAX_EXPORT_EDGE = 2000

/** How much bigger than the screen a design is exported. */
const SCREEN_MULTIPLE = 2

/**
 * Konva's name for the nodes that are notes to the visitor rather than part of
 * the design: the handles round the selected leaf, and the dashes showing where
 * a pattern may print.
 *
 * They are hidden for the length of an export and put back, so what a visitor
 * downloads is the product rather than the editor. It lives here, with the rest
 * of what export means, because the two nodes that wear it are drawn in two
 * different files and neither should be the one the other imports it from.
 */
export const ANNOTATION = 'editor-annotation'

/** What `Konva.Stage#toDataURL` is given: a crop in stage pixels, and a scale. */
export type ExportGeometry = {
  x: number
  y: number
  width: number
  height: number
  pixelRatio: number
}

/** The size in real pixels that `geometry` produces. */
export function exportedSize(geometry: ExportGeometry): Size {
  return {
    width: Math.round(geometry.width * geometry.pixelRatio),
    height: Math.round(geometry.height * geometry.pixelRatio),
  }
}

/**
 * The crop and scale for one export, or `null` when there is nothing to take a
 * picture of — a stage whose box has not been measured yet, or a mockup with no
 * size, both of which reach here as a zero fit.
 */
export function exportGeometry(mockup: Size, fit: Fit): ExportGeometry | null {
  const onScreen = Math.max(fit.width, fit.height)
  const native = Math.max(mockup.width, mockup.height)

  if (!(onScreen > 0) || !Number.isFinite(onScreen)) return null

  const target = Math.min(
    Math.max(SCREEN_MULTIPLE * onScreen, native),
    MAX_EXPORT_EDGE,
  )

  return {
    x: fit.offsetX,
    y: fit.offsetY,
    width: fit.width,
    height: fit.height,
    pixelRatio: target / onScreen,
  }
}
