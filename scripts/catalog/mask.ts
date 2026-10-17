/**
 * Turning the designer's line art into an ink mask.
 *
 * Their patterns arrive as a drawing on a white page — black lines on most,
 * taupe on สุขเส้นสาน — exported as JPEG, which means the lines are ringed
 * with grey and the paper is not quite white. What the editor wants instead is
 * a stencil: an alpha channel that is opaque where the ink is and transparent
 * where the paper was, so a leaf dye can be flooded through it and the cloth's
 * own colour can show between the lines (`src/editor/maskTint.ts`).
 *
 * The conversion is a levels step. Everything at or below `black` becomes
 * fully opaque ink, everything at or above `white` becomes paper, and the
 * ramp between them keeps the lines' antialiased edges from turning to
 * staircases.
 *
 * Where those two sit cannot be a constant. A fixed mid-grey threshold would
 * erase สุขเส้นสาน outright — its lines sit at a luminance of about 150, on
 * the *paper* side of 128 — so the levels are read from each drawing's own
 * distribution: the darkest half-percent is its ink, the lightest half-percent
 * its paper, and the two margins below pull the points inside that span far
 * enough to swallow JPEG noise without eating the lines. A drawing the reading
 * gets wrong can say so by hand, with `maskLevels` in the manifest.
 */

/** Where the ink ends and the paper begins, as 0–255 luminance. */
export type MaskLevels = { black: number; white: number }

/** Darkest and lightest fraction of the page taken as ink and as paper. */
export const INK_QUANTILE = 0.005
export const PAPER_QUANTILE = 0.995

/**
 * How far inside that span the two points are pulled, as a fraction of it.
 * The paper side is the larger of the two because that is where the noise is:
 * JPEG ringing is a halo of light grey around every line, and anything short
 * of this leaves it as a grey wash where the cloth should show through.
 */
export const BLACK_MARGIN = 0.1
export const WHITE_MARGIN = 0.25

/** How much of the drawing's own alphabet of greys is enough to read it. */
const MIN_SPAN = 8

/** The count of each luminance in a greyscale page, 256 long. */
export function histogramOf(grey: Uint8Array | Buffer): number[] {
  const counts = new Array<number>(256).fill(0)

  for (const value of grey) counts[value] += 1

  return counts
}

/** The luminance `fraction` of the page is at or below. */
function quantile(histogram: readonly number[], fraction: number): number {
  const total = histogram.reduce((sum, count) => sum + count, 0)
  if (total === 0) return 0

  const target = total * fraction
  let seen = 0

  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value]
    if (seen >= target) return value
  }

  return histogram.length - 1
}

/**
 * The levels to read a drawing at, from the drawing itself.
 *
 * A page with no span to speak of — a scan that is all ink, or all paper —
 * would otherwise come back with the two points on top of each other, so the
 * span is floored and the result is always `black < white`.
 */
export function levelsFromHistogram(histogram: readonly number[]): MaskLevels {
  const ink = quantile(histogram, INK_QUANTILE)
  const paper = quantile(histogram, PAPER_QUANTILE)
  const span = Math.max(paper - ink, MIN_SPAN)

  const black = Math.round(ink + span * BLACK_MARGIN)
  const white = Math.round(ink + span * (1 - WHITE_MARGIN))

  return { black, white: Math.max(white, black + 1) }
}

/** Alpha per luminance: opaque at `black`, gone at `white`, a ramp between. */
export function maskLut({ black, white }: MaskLevels): Uint8Array {
  const lut = new Uint8Array(256)
  const span = white - black

  for (let value = 0; value < 256; value += 1) {
    const ink = (white - value) / span

    lut[value] = Math.round(Math.min(Math.max(ink, 0), 1) * 255)
  }

  return lut
}

/**
 * A greyscale page as RGBA ink: black throughout, carrying its coverage in
 * the alpha channel.
 *
 * The colour is black rather than the dye it will be printed in, because the
 * dye is the visitor's to choose and this file outlives the choice. What
 * matters is that the three colour channels are uniform: WebP's lossy encoder
 * spends almost nothing on them, so the file is its alpha channel and little
 * else.
 */
export function inkMask(grey: Uint8Array | Buffer, levels: MaskLevels): Buffer {
  const lut = maskLut(levels)
  const rgba = Buffer.alloc(grey.length * 4)

  for (let pixel = 0; pixel < grey.length; pixel += 1) {
    rgba[pixel * 4 + 3] = lut[grey[pixel]]
  }

  return rgba
}

/** How a mask's levels are written in the log, and into the asset's hash. */
export const describeLevels = ({ black, white }: MaskLevels) =>
  `${String(black)}–${String(white)}`
