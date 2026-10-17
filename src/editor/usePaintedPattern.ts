/**
 * The pattern image a layer is painting right now.
 *
 * `usePatternImage` hands over a tinted, rasterised bitmap, but it reports a
 * moment of `loading` whenever the colours change — a new file is built and
 * decoded. Painting nothing for those frames makes the cloth blink every time
 * a leaf-dye swatch is tapped, so this keeps the last image that finished
 * decoding and hands that over until the next one is ready. An undecoded image
 * paints nothing anyway, and a broken one makes Konva throw, so this is also
 * what keeps either off the stage.
 *
 * Shared by both kinds of layer: a tile fills a rectangle with the bitmap and a
 * motif draws it as a single image, but which file, in which colours, at which
 * raster scale is one question with one answer.
 */
import { useState } from 'react'
import type { Pattern } from '@/catalog'
import { usePatternImage } from './usePatternImage'

export type PaintedPattern = {
  image: HTMLImageElement
  /** Image pixels per natural pixel of the tile, from `usePatternImage`. */
  ratio: number
  /** The asset's width divided by its height; 1 for anything unmeasurable. */
  aspect: number
}

function aspectOf(image: HTMLImageElement): number {
  const { naturalWidth, naturalHeight } = image

  return naturalHeight > 0 && naturalWidth > 0
    ? naturalWidth / naturalHeight
    : 1
}

/**
 * The image to paint, or `null` until the first one has decoded.
 *
 * It takes the pattern rather than its file because which file to fetch is
 * only half the question: how it is tinted — its own fills rewritten, or a
 * colour flooded through an ink mask — is the catalog's to answer too.
 */
export function usePaintedPattern(
  pattern: Pick<Pattern, 'src' | 'recolor'>,
  colors: readonly string[],
): PaintedPattern | null {
  const { status, image, ratio } = usePatternImage(
    pattern.src,
    colors,
    pattern.recolor,
  )
  const [painted, setPainted] = useState<PaintedPattern | null>(null)

  // Adjusted during render rather than in an effect, so the new image is on
  // the stage in the same commit it became ready — React re-runs the component
  // before anything is shown, and the comparison stops it there.
  if (status === 'loaded' && painted?.image !== image) {
    setPainted({ image, ratio, aspect: aspectOf(image) })
  }

  return painted
}
