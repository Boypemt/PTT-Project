/**
 * Finding the repeat inside a drawing, so the tile can be cut on it.
 *
 * The designer's artwork is a window onto a pattern rather than a tile of it:
 * a screenshot from the tool it was drawn in, cropped wherever the marquee
 * happened to fall, sometimes with a band of bare paper along one edge. The
 * drawing repeats, but the file does not — its left edge lands against its
 * right edge in the middle of a motif, and the repeat shows as a grid of
 * seams on the cloth. Every one of the eight patterns scored a seam that way.
 *
 * What is measured here is the drawing's own period. Slide the ink over
 * itself by one lag after another and ask how well the two copies agree,
 * as a correlation over everything they have in common: at the period it is
 * close to 1, and at every other lag it is close to nothing. Correlation
 * rather than a difference, because these are JPEGs of hairline drawings —
 * a line half a pixel out of step differs from itself almost everywhere,
 * which makes a plain difference nearly as large at the period as away from
 * it, while the correlation still sees the two drawings as the same drawing.
 *
 * Three details earn their place.
 *
 * The search reaches beyond half the image. Half is the comfortable
 * assumption — a tile you can see twice — but four of these eight repeat
 * only once and a bit inside their file, and capping the search at half the
 * width is exactly why their seams survived the first import. The limit here
 * is how much the two copies still overlap, not how many repeats fit.
 *
 * The search runs on a reduced copy and is then refined against the
 * full-resolution one, because a period measured a few pixels out is
 * multiplied by however many repeats are kept, and ten pixels in a thousand
 * is a seam again. The reduction also blurs fine lines into each other, so a
 * real period can come back weakly from it: the reduced copy only proposes
 * candidates, and full resolution decides between them.
 *
 * And bare paper at the edges is trimmed before anything else: a band is not
 * part of the repeat, it is the edge of a screenshot, and leaving it in puts
 * a stripe of blank cloth through the middle of the print.
 *
 * Everything here is arithmetic over an alpha map, so it is tested against
 * drawings made on purpose — a known period, a band glued on, noise with no
 * period at all — rather than against the artwork of the day.
 */

/** Ink coverage, 0–255, one byte per pixel, row-major. */
export type AlphaMap = { data: Uint8Array; width: number; height: number }

/** `x` compares columns, for the join the tile makes left to right. */
export type Axis = 'x' | 'y'

/** A run of lines along an axis: where the ink starts, and how far it goes. */
export type Span = { start: number; length: number }

export type Period = {
  /** Lines between one repeat and the next. */
  period: number
  /** How well the drawing agrees with itself there, -1 to 1. */
  match: number
}

/** How a crop came out on one axis. `period` is null where none was found. */
export type AxisCrop = Span & { period: number | null }

/** Long edge of the reduced copy the search runs on. */
export const SEARCH_EDGE = 400

/** No pattern repeats faster than this, in lines or in fractions of the edge. */
export const MIN_PERIOD = 8
export const MIN_PERIOD_FRACTION = 1 / 20

/**
 * The longest repeat worth asking about, as a fraction of the drawing. What
 * is left over is what the two copies still have to agree on, so this is a
 * floor on the evidence rather than a guess at the pattern: at 0.72 a quarter
 * of the drawing is still being compared, which is hundreds of thousands of
 * pixels.
 */
export const MAX_PERIOD_FRACTION = 0.72

/** How well a drawing has to agree with itself before this says "period". */
export const MIN_CORRELATION = 0.75

/**
 * A lag agreeing this nearly as well as the best is the same answer, so the
 * shorter one wins — a drawing that repeats every 200 lines also lands on
 * itself at 400, and cropping to the double keeps a seam the single cuts out.
 * Kept tight, because on this artwork the longer lag is often honestly better:
 * these are rendered patterns whose motif grid drifts a fraction of a pixel a
 * repeat, and the seam is what that drift costs.
 */
export const FUNDAMENTAL_SLACK = 0.01

/** How far below the best a reduced-copy peak may be and still be looked at. */
export const CANDIDATE_SLACK = 0.2
export const MAX_CANDIDATES = 6

/**
 * An axis where even the worst lag agrees this well has no structure along
 * it to key on — every row the same row — and "it repeats" is a true answer
 * to a question nobody asked. Cropping it would cut a drawing on nothing.
 */
export const FEATURELESS = 0.95

/** Ink this faint is paper, for deciding where the drawing starts and ends. */
export const INK_FLOOR = 16

/**
 * How an axis is walked: `lines` of it, `lineStride` apart, each line read
 * `pixelStride` at a time. Both axes are the same loop with these swapped.
 */
function walk(map: AlphaMap, axis: Axis) {
  return axis === 'x'
    ? {
        length: map.width,
        lineStride: 1,
        pixels: map.height,
        pixelStride: map.width,
      }
    : {
        length: map.height,
        lineStride: map.width,
        pixels: map.width,
        pixelStride: 1,
      }
}

export const lengthAlong = (map: AlphaMap, axis: Axis): number =>
  axis === 'x' ? map.width : map.height

/** The whole of one axis, for a caller with nothing narrower in mind. */
export const wholeSpan = (map: AlphaMap, axis: Axis): Span => ({
  start: 0,
  length: lengthAlong(map, axis),
})

/**
 * How well the drawing agrees with itself, slid along `axis` by `lag`:
 * the correlation over everything the two copies have in common, 1 for the
 * same drawing again and 0 for two unrelated ones.
 *
 * A page with nothing on it has nothing to agree about and scores 0, which
 * keeps a blank sheet from reading as a pattern that repeats everywhere.
 */
export function correlation(
  map: AlphaMap,
  axis: Axis,
  lag: number,
  span: Span,
): number {
  const { lineStride, pixels, pixelStride } = walk(map, axis)
  const lines = span.length - lag

  if (lines <= 0 || pixels <= 0) return 0

  let sumHere = 0
  let sumThere = 0
  let sumHere2 = 0
  let sumThere2 = 0
  let sumBoth = 0

  for (let line = 0; line < lines; line += 1) {
    const here = (span.start + line) * lineStride
    const there = (span.start + line + lag) * lineStride

    for (let pixel = 0; pixel < pixels; pixel += 1) {
      const at = pixel * pixelStride
      const a = map.data[here + at]
      const b = map.data[there + at]

      sumHere += a
      sumThere += b
      sumHere2 += a * a
      sumThere2 += b * b
      sumBoth += a * b
    }
  }

  const count = lines * pixels
  const meanHere = sumHere / count
  const meanThere = sumThere / count
  const varHere = sumHere2 / count - meanHere * meanHere
  const varThere = sumThere2 / count - meanThere * meanThere

  if (varHere <= 0 || varThere <= 0) return 0

  return (
    (sumBoth / count - meanHere * meanThere) / Math.sqrt(varHere * varThere)
  )
}

/** The lags worth asking about on this axis. */
function lagRange(length: number): { smallest: number; largest: number } {
  return {
    smallest: Math.max(MIN_PERIOD, Math.ceil(length * MIN_PERIOD_FRACTION)),
    largest: Math.floor(length * MAX_PERIOD_FRACTION),
  }
}

/** Every lag, scored. Index 0 is `smallest`. */
function curve(map: AlphaMap, axis: Axis, span: Span): number[] {
  const { smallest, largest } = lagRange(span.length)
  const scores: number[] = []

  for (let lag = smallest; lag <= largest; lag += 1) {
    scores.push(correlation(map, axis, lag, span))
  }

  return scores
}

const lowest = (scores: readonly number[]) =>
  scores.reduce((least, one) => Math.min(least, one), Infinity)

const highest = (scores: readonly number[]) =>
  scores.reduce((most, one) => Math.max(most, one), -Infinity)

/** Whether this axis holds anything a repeat could be measured against. */
const featureless = (scores: readonly number[]) =>
  scores.length === 0 || lowest(scores) > FEATURELESS

/** The shortest lag that agrees as nearly as well as the best one does. */
function fundamental(scored: readonly Period[]): Period | null {
  const best = scored.reduce(
    (top: Period | null, one) =>
      top === null || one.match > top.match ? one : top,
    null,
  )

  if (best === null || best.match < MIN_CORRELATION) return null

  return scored
    .filter((one) => one.match >= best.match - FUNDAMENTAL_SLACK)
    .reduce((first, one) => (one.period < first.period ? one : first), best)
}

/**
 * The drawing's period along `axis`, or `null` where it has none worth
 * believing. One resolution, which is the whole measurement for a drawing
 * small enough not to need the reduced copy.
 */
export function detectPeriod(
  map: AlphaMap,
  axis: Axis,
  span: Span = wholeSpan(map, axis),
): Period | null {
  const { smallest, largest } = lagRange(span.length)

  if (largest < smallest) return null

  const scores = curve(map, axis, span)

  if (featureless(scores)) return null

  const peaks = scores
    .map((match, index) => ({ period: smallest + index, match }))
    .filter(
      (_, index) =>
        scores[index] >= (scores[index - 1] ?? -Infinity) &&
        scores[index] >= (scores[index + 1] ?? -Infinity),
    )

  return fundamental(peaks)
}

/**
 * The lags a reduced copy puts forward, in full-resolution terms.
 *
 * Not the single best of them: reducing a hairline drawing blurs its lines
 * together, and a real period can come back from the reduced copy barely
 * ahead of a spurious one. Everything close to the best is carried through
 * to full resolution, which can tell them apart.
 */
function candidates(search: AlphaMap, axis: Axis, span: Span): number[] {
  const { smallest, largest } = lagRange(span.length)

  if (largest < smallest) return []

  const scores = curve(search, axis, span)

  if (featureless(scores)) return []

  const best = highest(scores)

  return scores
    .map((match, index) => ({ period: smallest + index, match }))
    .filter(
      (one, index) =>
        one.match >= best - CANDIDATE_SLACK &&
        scores[index] >= (scores[index - 1] ?? -Infinity) &&
        scores[index] >= (scores[index + 1] ?? -Infinity),
    )
    .sort((a, b) => b.match - a.match)
    .slice(0, MAX_CANDIDATES)
    .map((one) => one.period)
}

/**
 * The best lag within `radius` of `around`, measured on the map given. The
 * reduction is what makes the search affordable; this is what makes its
 * answer exact.
 */
export function refinePeriod(
  map: AlphaMap,
  axis: Axis,
  span: Span,
  around: number,
  radius: number,
): Period {
  const { smallest, largest } = lagRange(span.length)
  const from = Math.max(smallest, around - radius)
  const to = Math.min(largest, around + radius)

  let best: Period = { period: from, match: -Infinity }

  for (let lag = from; lag <= to; lag += 1) {
    const match = correlation(map, axis, lag, span)

    if (match > best.match) best = { period: lag, match }
  }

  return best
}

/**
 * Where the drawing actually starts and ends along `axis`.
 *
 * Bare paper at an edge is the edge of a screenshot rather than part of the
 * repeat — ask the pattern to tile with it and the blank band prints as a
 * stripe across the cloth — so it is cut off before the period is looked for.
 */
export function inkedSpan(map: AlphaMap, axis: Axis, floor = INK_FLOOR): Span {
  const { length, lineStride, pixels, pixelStride } = walk(map, axis)

  const inked = (line: number): boolean => {
    const at = line * lineStride

    for (let pixel = 0; pixel < pixels; pixel += 1) {
      if (map.data[at + pixel * pixelStride] >= floor) return true
    }

    return false
  }

  let start = 0
  while (start < length && !inked(start)) start += 1

  // Nothing on the page at all: leave it whole rather than crop it to nothing.
  if (start === length) return { start: 0, length }

  let end = length - 1
  while (end > start && !inked(end)) end -= 1

  return { start, length: end - start + 1 }
}

/**
 * The crop for one axis: whole repeats of the drawing, inside its ink.
 *
 * An axis whose period could not be found is handed back whole. That is the
 * conservative answer — the artwork is the designer's, and a confident wrong
 * crop would cut their drawing in half — and the caller says so out loud.
 */
export function cropAxis(
  full: AlphaMap,
  search: AlphaMap,
  axis: Axis,
): AxisCrop {
  const whole = wholeSpan(full, axis)
  const span = inkedSpan(full, axis)
  const ratio = lengthAlong(full, axis) / lengthAlong(search, axis)

  const proposed = candidates(search, axis, {
    start: Math.round(span.start / ratio),
    length: Math.round(span.length / ratio),
  })

  const refined = proposed.map((period) =>
    refinePeriod(
      full,
      axis,
      span,
      Math.round(period * ratio),
      Math.ceil(ratio) + 1,
    ),
  )

  const found = fundamental(refined)

  if (found === null) return { ...whole, period: null }

  const repeats = Math.floor(span.length / found.period)

  if (repeats < 1) return { ...whole, period: null }

  return {
    start: span.start,
    length: repeats * found.period,
    period: found.period,
  }
}
