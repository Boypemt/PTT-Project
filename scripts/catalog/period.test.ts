/**
 * Drawings made on purpose, so the measurement can be checked against an
 * answer that is known rather than against this week's artwork: a pattern
 * with a period, the same pattern with a band of bare paper glued to its
 * edges, and noise that has no period at all. The last one matters most — a
 * confident wrong period would cut a drawing in half.
 */
import { describe, expect, it } from 'vitest'
import {
  type AlphaMap,
  correlation,
  cropAxis,
  detectPeriod,
  inkedSpan,
  refinePeriod,
} from './period.ts'

/** An alpha map from a function of x and y. */
function draw(
  width: number,
  height: number,
  ink: (x: number, y: number) => number,
): AlphaMap {
  const data = new Uint8Array(width * height)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) data[y * width + x] = ink(x, y)
  }

  return { data, width, height }
}

/** Bars across the page: a period along x, and nothing at all along y. */
const bars = (width: number, height: number, period: number) =>
  draw(width, height, (x) => (x % period < period / 2 ? 255 : 0))

/** A period on both axes. */
const checks = (
  width: number,
  height: number,
  px: number,
  py: number,
): AlphaMap =>
  draw(width, height, (x, y) =>
    (Math.floor(x / (px / 2)) + Math.floor(y / (py / 2))) % 2 === 0 ? 255 : 0,
  )

/** The same drawing with bare paper along the top and bottom edges. */
function banded(map: AlphaMap, top: number, bottom: number): AlphaMap {
  const height = map.height + top + bottom
  const data = new Uint8Array(map.width * height)

  data.set(map.data, top * map.width)

  return { data, width: map.width, height }
}

/** No period anywhere, from a generator that gives the same page every run. */
function noise(width: number, height: number): AlphaMap {
  let seed = 12345

  return draw(width, height, () => {
    seed = (seed * 1103515245 + 12345) % 2147483648

    return seed % 256
  })
}

describe('detectPeriod', () => {
  it('finds the period a drawing repeats on', () => {
    expect(detectPeriod(bars(400, 300, 40), 'x')?.period).toBe(40)
  })

  it('answers with the repeat itself, not a multiple of it', () => {
    // A drawing that repeats every 50 lands on itself at 100 and 150 too.
    // Cropping to one of those would keep a seam the fundamental cuts out.
    expect(detectPeriod(bars(600, 200, 50), 'x')?.period).toBe(50)
  })

  it('finds a period on each axis of a drawing that has both', () => {
    const map = checks(400, 400, 40, 50)

    expect(detectPeriod(map, 'x')?.period).toBe(40)
    expect(detectPeriod(map, 'y')?.period).toBe(50)
  })

  it('reports no period for a drawing that has none', () => {
    expect(detectPeriod(noise(400, 300), 'x')).toBeNull()
  })

  it('reports no period down an axis that never changes', () => {
    // Bars across the page are the same row over and over: every lag agrees
    // perfectly, which is not a repeat, it is an axis with nothing on it.
    expect(detectPeriod(bars(400, 300, 40), 'y')).toBeNull()
  })

  it('reports no period for a page with nothing on it', () => {
    expect(
      detectPeriod(
        draw(400, 300, () => 0),
        'x',
      ),
    ).toBeNull()
  })

  it('agrees with itself at the period and disagrees between', () => {
    const map = bars(400, 300, 40)
    const span = { start: 0, length: 400 }

    expect(detectPeriod(map, 'x')?.match).toBeGreaterThan(0.95)

    // Half a period along, the bars land in the gaps: the same drawing
    // inside out, which is as far from a repeat as it gets.
    expect(correlation(map, 'x', 20, span)).toBeLessThan(0)
  })

  it('finds a repeat that only fits once and a bit in the file', () => {
    // Four of the designer's eight are like this, and a search that stops at
    // half the width is exactly why their seams survived the first import.
    const map = draw(400, 200, (x) => (x % 260 < 130 ? 255 : 0))

    expect(detectPeriod(map, 'x')?.period).toBe(260)
  })
})

describe('refinePeriod', () => {
  it('lands on the exact period from a rough one', () => {
    const map = bars(400, 300, 40)
    const span = { start: 0, length: 400 }

    expect(refinePeriod(map, 'x', span, 43, 5).period).toBe(40)
  })
})

describe('inkedSpan', () => {
  it('finds where the drawing starts and ends', () => {
    const map = banded(checks(200, 160, 40, 40), 17, 23)

    expect(inkedSpan(map, 'y')).toEqual({ start: 17, length: 160 })
  })

  it('leaves a page with no ink on it whole', () => {
    const blank = draw(100, 100, () => 0)

    expect(inkedSpan(blank, 'y')).toEqual({ start: 0, length: 100 })
  })

  it('reads faint ink as paper and solid ink as the drawing', () => {
    const faint = draw(100, 100, (_x, y) => (y < 10 ? 4 : 255))

    expect(inkedSpan(faint, 'y').start).toBe(10)
  })
})

describe('cropAxis', () => {
  it('cuts the drawing to whole repeats', () => {
    const map = checks(410, 400, 40, 50)
    const crop = cropAxis(map, map, 'x')

    // 410 wide, repeating every 40: ten repeats and ten pixels over.
    expect(crop).toEqual({ start: 0, length: 400, period: 40 })
  })

  it('leaves the bare paper at the edges out of the tile', () => {
    const map = banded(checks(200, 260, 40, 40), 17, 23)
    const crop = cropAxis(map, map, 'y')

    // The band is not part of the repeat: the crop starts below it, and
    // takes the six whole repeats that fit in the 260 lines of drawing.
    expect(crop).toEqual({ start: 17, length: 240, period: 40 })
  })

  it('leaves an axis with no period alone, and says so', () => {
    const map = noise(400, 300)

    expect(cropAxis(map, map, 'x')).toEqual({
      start: 0,
      length: 400,
      period: null,
    })
  })

  it('crops one axis of a drawing that only repeats on one', () => {
    const map = bars(410, 300, 40)

    expect(cropAxis(map, map, 'x').period).toBe(40)
    expect(cropAxis(map, map, 'y')).toEqual({
      start: 0,
      length: 300,
      period: null,
    })
  })
})
