/**
 * The two drawings this has to survive are the two the designer sent: black
 * ink on white, and สุขเส้นสาน's taupe, whose lines sit at a luminance of
 * about 150 — lighter than a mid-grey threshold, which would have erased it.
 * Both are written out below as histograms, because that is all the levels
 * are read from.
 */
import { describe, expect, it } from 'vitest'
import {
  histogramOf,
  inkMask,
  levelsFromHistogram,
  maskLut,
  type MaskLevels,
} from './mask.ts'

/** A page: `ink` per cent of it at `line`, the rest paper at 255. */
function page(line: number, ink: number): number[] {
  const histogram = new Array<number>(256).fill(0)

  histogram[line] = ink * 100
  histogram[255] = (100 - ink) * 100

  return histogram
}

const alphaAt = (levels: MaskLevels, luminance: number) =>
  maskLut(levels)[luminance]

describe('levelsFromHistogram', () => {
  it('reads black line art against its paper', () => {
    const levels = levelsFromHistogram(page(0, 37))

    expect(levels).toEqual({ black: 26, white: 191 })
  })

  it('reads taupe lines the same way, where a threshold would lose them', () => {
    // สุขเส้นสาน: lines at 150, which is on the *paper* side of mid-grey.
    const levels = levelsFromHistogram(page(150, 22))

    expect(alphaAt(levels, 150)).toBe(255)
    expect(alphaAt(levels, 255)).toBe(0)

    // And the JPEG halo that the lines are ringed with is paper, not ink.
    expect(alphaAt(levels, 240)).toBe(0)
  })

  it('always leaves a span to read, however flat the page', () => {
    const { black, white } = levelsFromHistogram(page(0, 100))

    expect(white).toBeGreaterThan(black)
  })

  it('counts a greyscale page into a histogram', () => {
    expect(histogramOf(Uint8Array.from([0, 0, 255]))[0]).toBe(2)
    expect(histogramOf(Uint8Array.from([0, 0, 255]))[255]).toBe(1)
  })
})

describe('maskLut', () => {
  it('is opaque at the ink, gone at the paper, and a ramp between', () => {
    const levels = { black: 50, white: 150 }

    expect(alphaAt(levels, 0)).toBe(255)
    expect(alphaAt(levels, 50)).toBe(255)
    expect(alphaAt(levels, 100)).toBe(128)
    expect(alphaAt(levels, 150)).toBe(0)
    expect(alphaAt(levels, 255)).toBe(0)
  })

  it('never climbs back up as the page gets lighter', () => {
    const lut = maskLut({ black: 26, white: 191 })

    for (let value = 1; value < 256; value += 1) {
      expect(lut[value]).toBeLessThanOrEqual(lut[value - 1])
    }
  })
})

describe('inkMask', () => {
  it('carries the drawing in the alpha channel and nowhere else', () => {
    const rgba = inkMask(Uint8Array.from([0, 255]), { black: 26, white: 191 })

    // Black throughout: the colour is the visitor's to choose, so the file
    // holds only how much ink there is.
    expect([...rgba]).toEqual([0, 0, 0, 255, 0, 0, 0, 0])
  })
})
