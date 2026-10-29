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
 * itself by one lag after another and ask how much of it lands back on
 * itself: at the period, almost all of it does, and the self-difference drops
 * into a trough. The trough has to be deep against the drawing's own
 * typical difference — a photograph of leaves has no period, and answering
 * with one would crop a pattern to an arbitrary fraction of itself — so a
 * drawing with no clear trough is reported as having no period at all, and
 * the caller leaves that axis alone.
 *
 * Two details earn their place. The search runs on a reduced copy and is then
 * refined against the full-resolution one, because a period measured a few
 * pixels out is multiplied by however many repeats are kept, and an error of
 * ten pixels in a thousand is a seam again. And bare paper at the edges is
 * trimmed before anything else: a band is not part of the repeat, it is the
 * edge of a screenshot, and leaving it in puts a stripe of blank cloth
 * through the middle of the print.
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
  /** The self-difference at that lag, 0–255. Lower is a better repeat. */
  match: number
  /** What a lag that is *not* the period typically scores. */
  baseline: number
}

/** How a crop came out on one axis. `period` is null where none was found. */
export type AxisCrop = Span & { period: number | null }

/** Long edge of the reduced copy the search runs on. */
export const SEARCH_EDGE = 400

/** No pattern repeats faster than this, in lines or in fractions of the edge. */
export const MIN_PERIOD = 8
export const MIN_PERIOD_FRACTION = 1 / 20

/** How far below the typical lag the trough has to sit to be believed. */
export const CONFIDENT_RATIO = 0.45

/** A lag this close to the best is the same trough, so the first one wins. */
export const HARMONIC_TOLERANCE = 1.35

/** Below this there is no texture to find a period in: a blank page scores 0. */
export const MIN_TEXTURE = 1.5

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
 * How different the drawing is from itself, slid along `axis` by `lag`:
 * the mean absolute difference over everything the two copies have in common,
 * 0 (it lands back on itself exactly) to 255.
 */
export function shiftDiff(
  map: AlphaMap,
  axis: Axis,
  lag: number,
  span: Span,
): number {
  const { lineStride, pixels, pixelStride } = walk(map, axis)
  const lines = span.length - lag

  if (lines <= 0 || pixels <= 0) return 0

  let total = 0

  for (let line = 0; line < lines; line += 1) {
    const here = (span.start + line) * lineStride
    const there = (span.start + line + lag) * lineStride

    for (let pixel = 0; pixel < pixels; pixel += 1) {
      const at = pixel * pixelStride

      total += Math.abs(map.data[here + at] - map.data[there + at])
    }
  }

  return total / (lines * pixels)
}

/** The middle value, which a single deep trough cannot drag down. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

/**
 * The drawing's period along `axis`, or `null` where it has none worth
 * believing.
 *
 * The smallest lag in the trough wins, not the deepest: a pattern that
 * repeats every 200 lines also lands on itself at 400, and cropping to the
 * double would keep a seam the single would have cut out.
 */
export function detectPeriod(
  map: AlphaMap,
  axis: Axis,
  span: Span = wholeSpan(map, axis),
): Period | null {
  const smallest = Math.max(
    MIN_PERIOD,
    Math.ceil(span.length * MIN_PERIOD_FRACTION),
  )
  // Half the span: a lag longer than that has never been seen to repeat.
  const largest = Math.floor(span.length / 2)

  if (largest < smallest) return null

  const diffs: number[] = []
  for (let lag = smallest; lag <= largest; lag += 1) {
    diffs.push(shiftDiff(map, axis, lag, span))
  }

  const baseline = median(diffs)
  const best = Math.min(...diffs)

  // A page with nothing on it matches itself at every lag, and noise matches
  // itself at none. Neither has a period to cut on.
  if (baseline < MIN_TEXTURE) return null
  if (best > baseline * CONFIDENT_RATIO) return null

  const threshold = Math.max(best * HARMONIC_TOLERANCE, best + 0.5)
  const first = diffs.findIndex(
    (diff, index) =>
      diff <= threshold &&
      diff <= (diffs[index - 1] ?? Infinity) &&
      diff <= (diffs[index + 1] ?? Infinity),
  )

  if (first < 0) return null

  return { period: smallest + first, match: diffs[first], baseline }
}

/**
 * The same measurement again at full resolution, within `radius` of a period
 * found on the reduced copy. The reduction is what makes the search
 * affordable; this is what makes its answer exact.
 */
export function refinePeriod(
  map: AlphaMap,
  axis: Axis,
  span: Span,
  around: number,
  radius: number,
): number {
  const from = Math.max(1, around - radius)
  const to = Math.min(Math.floor(span.length / 2), around + radius)

  let best = from
  let bestDiff = Infinity

  for (let lag = from; lag <= to; lag += 1) {
    const diff = shiftDiff(map, axis, lag, span)

    if (diff < bestDiff) {
      bestDiff = diff
      best = lag
    }
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

  const found = detectPeriod(search, axis, {
    start: Math.round(span.start / ratio),
    length: Math.round(span.length / ratio),
  })

  if (found === null) return { ...whole, period: null }

  const period = refinePeriod(
    full,
    axis,
    span,
    Math.round(found.period * ratio),
    Math.ceil(ratio) + 1,
  )
  const repeats = Math.floor(span.length / period)

  if (repeats < 1) return { ...whole, period: null }

  return { start: span.start, length: repeats * period, period }
}
