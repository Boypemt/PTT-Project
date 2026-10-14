/**
 * A pattern SVG rasterised for Konva's pattern fill.
 *
 * Konva fills a shape by handing the image to `createPattern`, which turns it
 * into a bitmap once, at its natural size, and from then on only scales that
 * bitmap. An SVG therefore stops being vectors the moment it becomes a
 * pattern: a 200 px tile stretched up — by the scale slider, or just by a
 * high-DPI screen drawing more device pixels than stage pixels — would blur.
 * Drawing it to a canvas at `RASTER_SCALE` first gives the pattern that many
 * more pixels to sample from, and `ratio` tells the caller to divide its
 * pattern scale by the same number, so a bigger bitmap does not come out as a
 * bigger tile.
 *
 * The rasterised tile goes back through `useImage` as a data URL rather than
 * being handed to Konva as a canvas: `fillPatternImage` wants an
 * `HTMLImageElement`, and this way the per-URL cache applies to the raster
 * too, so each pattern is drawn and encoded once for the whole session.
 *
 * Where there is no 2D context to draw on — jsdom in the unit tests, or a
 * browser refusing a canvas — it falls back to the SVG element itself at
 * `ratio` 1. Konva can still fill with that; only the sharpness is lost.
 *
 * Colours arrive through `useTintedSvg`, which hands over the same file with
 * the design's colours written into it. The raster cache is keyed on them too,
 * so one tile in two colourways is two bitmaps and going back to the first
 * costs nothing. A design with no colours, or a file that could not be read,
 * rasterises the pattern as it is on disk — in the `var(--c1, …)` fallbacks
 * written into it, which are its `defaultColors`.
 */
import { useMemo } from 'react'
import { useImage, type ImageStatus } from './useImage'
import { useTintedSvg } from './useTintedSvg'

/** Image pixels per natural pixel of a tile. Two is enough for any screen. */
export const RASTER_SCALE = 2

export type PatternImage = {
  status: ImageStatus
  /** Only paint it when `status` is `loaded`, as with `useImage`. */
  image: HTMLImageElement
  /** Image pixels per natural pixel of the tile in `image`. */
  ratio: number
}

/**
 * Data URL per source URL, or `null` for a source that cannot be rasterised
 * here. Never evicted, like the image cache it feeds: a session touches a
 * handful of patterns, and dropping one would mean drawing and encoding it
 * again the next time the visitor picks it.
 */
const rasters = new Map<string, string | null>()

/** Drops every rasterised tile. For tests, as `resetImageCache` is. */
export function resetPatternRasters(): void {
  rasters.clear()
}

/** `image` drawn at `RASTER_SCALE` as a data URL, or `null` if it cannot be. */
function drawRaster(image: HTMLImageElement): string | null {
  const width = image.naturalWidth * RASTER_SCALE
  const height = image.naturalHeight * RASTER_SCALE

  // An SVG without its own width and height decodes to nothing to scale up.
  if (width <= 0 || height <= 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (context === null) return null

  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/png')
}

function rasterUrl(key: string, image: HTMLImageElement): string | null {
  const cached = rasters.get(key)
  if (cached !== undefined) return cached

  const url = drawRaster(image)
  rasters.set(key, url)

  return url
}

export function usePatternImage(
  src: string,
  colors: readonly string[] = [],
): PatternImage {
  // The file with the design's colours in it, or nothing while that is being
  // fetched — and then the pattern as it is on disk, in its own defaults.
  const tinted = useTintedSvg(src, colors)
  const url = tinted.url ?? src
  const source = useImage(url)

  // Keyed by the pattern and its colours rather than by the URL: a tinted URL
  // is the whole file, and the same tile in two colourways is two rasters.
  const key = `${src}|${colors.join(',')}@${String(RASTER_SCALE)}x`

  const raster = useMemo(
    () => (source.status === 'loaded' ? rasterUrl(key, source.image) : null),
    [key, source.status, source.image],
  )

  // One `useImage` call either way, so the hook order never changes. Before a
  // raster exists this asks for the SVG the line above already holds, which
  // the cache answers without a second request.
  const rastered = useImage(raster ?? url)

  if (raster === null) return { ...source, ratio: 1 }

  return { status: rastered.status, image: rastered.image, ratio: RASTER_SCALE }
}
