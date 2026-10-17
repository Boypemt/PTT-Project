/**
 * The designer's line art, painted in a leaf-dye colour.
 *
 * Their patterns arrive as ink on paper, and the import keeps only the ink:
 * `scripts/catalog/mask.ts` turns the drawing's darkness into an alpha
 * channel, so the file that reaches the browser is a stencil — opaque where a
 * line is, transparent everywhere else. Tinting it is then one composite:
 * draw the stencil, switch to `source-in`, and flood the canvas with the
 * colour, which lands only where the alpha let it through.
 *
 * What that buys is the thing a flat picture cannot do. The ground stays
 * transparent, so the cloth's own colour shows between the lines and changing
 * the base colour changes the cloth under the print rather than a white sheet
 * laid over it — which is how an eco-print actually looks.
 *
 * Each colourway is encoded once and kept for the session, like the rasterised
 * SVGs beside it: a visitor tries a handful of dyes and goes back to the one
 * they liked, and the second visit should cost nothing. Where there is no 2D
 * context to paint on — jsdom, or a browser refusing a canvas — this reports
 * nothing and the caller draws the untinted stencil, which is ink-coloured but
 * present. A tile in the wrong colour beats a tile that is not there.
 */

/** Tinted data URL per pattern and colour, or `null` where it cannot be made. */
const tints = new Map<string, string | null>()

/** Drops every tinted mask. For tests, as `resetPatternRasters` is. */
export function resetMaskTints(): void {
  tints.clear()
}

/** `image`'s alpha flooded with `color`, or `null` if it cannot be painted. */
function paint(image: HTMLImageElement, color: string): string | null {
  const { naturalWidth: width, naturalHeight: height } = image

  // An image that decoded to nothing has no alpha to paint through.
  if (width <= 0 || height <= 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (context === null) return null

  context.drawImage(image, 0, 0)
  // Everything drawn from here on is kept only where the stencil is opaque.
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = color
  context.fillRect(0, 0, width, height)

  // PNG rather than WebP: the ink is two tones and an alpha channel, which
  // compresses to little either way, and this one cannot lose an edge to it.
  return canvas.toDataURL('image/png')
}

/** The mask in `color`, painted once per `key` and kept for the session. */
export function tintedMask(
  key: string,
  image: HTMLImageElement,
  color: string,
): string | null {
  const cached = tints.get(key)
  if (cached !== undefined) return cached

  const url = paint(image, color)
  tints.set(key, url)

  return url
}
