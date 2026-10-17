/**
 * How badly a tile will show where it repeats.
 *
 * A tile is printed over and over across the cloth, so its left edge lands
 * against its right edge and its top against its bottom. Where the drawing
 * does not continue across that join, the repeat shows as a grid of seams.
 * For each axis this measures how different the two edges are, 0 (they meet
 * exactly) to 100, next to the difference between two neighbouring lines
 * *inside* the picture. That second number is what makes the first readable:
 * a grainy hand-drawn wash has a noisy interior, so an edge difference of 2
 * there means nothing, while on a flat vector drawing it is a visible line.
 *
 * It is a warning and never an error. A pattern meant to be placed once
 * rather than repeated (`fit: "area"`) has edges that were never supposed to
 * meet, and plenty of patterns look fine with a soft seam. The designer
 * decides; this only points.
 */

export type Seam = {
  /** How different the two edges that meet in the repeat are, 0–100. */
  score: number
  /** How different two neighbouring lines inside the picture are, 0–100. */
  noise: number
}

export type Seams = { horizontal: Seam; vertical: Seam }

/** An edge difference below this is never worth saying anything about. */
export const SEAM_FLOOR = 2

/** …nor is one this close to the picture's own grain. */
export const SEAM_OVER_NOISE = 2

/**
 * Mean absolute difference between two columns (or rows) of pixels, 0–100.
 * Channels are averaged, which is enough to tell "the drawing continues" from
 * "it stops" without weighing one colour against another.
 */
function lineDiff(
  data: Buffer,
  channels: number,
  stride: number,
  lines: number,
  a: number,
  b: number,
): number {
  let total = 0

  for (let i = 0; i < lines; i += 1) {
    const left = (i * stride + a) * channels
    const right = (i * stride + b) * channels

    for (let c = 0; c < channels; c += 1) {
      total += Math.abs(data[left + c] - data[right + c])
    }
  }

  return (total / (lines * channels) / 255) * 100
}

/** The typical difference between neighbours, sampled across the picture. */
function noiseOf(diff: (a: number, b: number) => number, size: number): number {
  if (size < 2) return 0

  // Three places across the picture, each compared with the line next to it —
  // and never with itself, which the last one would be at the far edge.
  const sampled = [0.25, 0.5, 0.75]
    .map((f) => Math.min(Math.floor(size * f), size - 2))
    .map((x) => diff(x, x + 1))

  return sampled.reduce((sum, value) => sum + value, 0) / sampled.length
}

/**
 * The seam scores of a picture held as raw, interleaved pixels — what
 * `sharp(…).raw()` hands over, and the whole of the measurement.
 */
export function seamsOfRaw(
  data: Buffer,
  {
    width,
    height,
    channels,
  }: { width: number; height: number; channels: number },
): Seams {
  // Left edge against right edge: the join when the tile repeats sideways.
  const columns = (a: number, b: number) =>
    lineDiff(data, channels, width, height, a, b)

  // And the same down the picture, reading it a row at a time.
  const rows = (a: number, b: number) =>
    lineDiff(data, channels, 1, width, a * width, b * width)

  return {
    horizontal: {
      score: columns(0, width - 1),
      noise: noiseOf(columns, width),
    },
    vertical: {
      score: rows(0, height - 1),
      noise: noiseOf(rows, height),
    },
  }
}

/**
 * Whether a seam is worth saying anything about: far enough from zero to see,
 * and far enough above the picture's own grain that it is the drawing
 * stopping rather than the paper.
 */
export const seamWarns = (seam: Seam) =>
  seam.score > SEAM_FLOOR && seam.score > seam.noise * SEAM_OVER_NOISE

/** The edges to name in a warning, or nothing where none is worth naming. */
export function seamWarnings(seams: Seams): string[] {
  return [
    seamWarns(seams.horizontal) ? 'left|right' : undefined,
    seamWarns(seams.vertical) ? 'top|bottom' : undefined,
  ].filter((edge) => edge !== undefined)
}
