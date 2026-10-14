import { describe, expect, it } from 'vitest'
import {
  clamp,
  clampPointToRect,
  fitContain,
  pixelRatio,
  toMockupPoint,
  toStagePoint,
  type Fit,
} from './geometry'

/** The fixture mockup: a square cloth in a landscape container. */
const square = { width: 800, height: 800 }

describe('clamp', () => {
  it('passes a value inside the range through', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('stops at either bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })

  it('reads NaN as the lower bound', () => {
    expect(clamp(Number.NaN, 1, 10)).toBe(1)
  })
})

describe('clampPointToRect', () => {
  const rect = { x: 60, y: 60, width: 680, height: 680 }

  it('leaves a point inside the rectangle alone', () => {
    expect(clampPointToRect({ x: 100, y: 200 }, rect)).toEqual({
      x: 100,
      y: 200,
    })
  })

  it('pulls a point outside back onto the edge', () => {
    expect(clampPointToRect({ x: -40, y: 5000 }, rect)).toEqual({
      x: 60,
      y: 740,
    })
  })
})

describe('fitContain', () => {
  it('fits a square mockup into a wide container by its height', () => {
    expect(fitContain(square, { width: 1000, height: 400 })).toEqual({
      scale: 0.5,
      offsetX: 300,
      offsetY: 0,
      width: 400,
      height: 400,
    })
  })

  it('fits it into a tall container by its width', () => {
    expect(fitContain(square, { width: 400, height: 1000 })).toEqual({
      scale: 0.5,
      offsetX: 0,
      offsetY: 300,
      width: 400,
      height: 400,
    })
  })

  it('keeps the aspect ratio of a non-square mockup', () => {
    const fit = fitContain({ width: 1200, height: 800 }, square)

    expect(fit.width / fit.height).toBeCloseTo(1.5)
    expect(fit.height).toBeCloseTo(533.33, 2)
  })

  it('scales up to fill a container larger than the mockup', () => {
    expect(fitContain(square, { width: 1600, height: 1600 }).scale).toBe(2)
  })

  it('never crops: the fitted size stays inside the container', () => {
    const container = { width: 640, height: 480 }
    const fit = fitContain({ width: 900, height: 1600 }, container)

    expect(fit.width).toBeLessThanOrEqual(container.width)
    expect(fit.height).toBeLessThanOrEqual(container.height)
  })

  it('draws nothing while the container is still unmeasured', () => {
    expect(fitContain(square, { width: 0, height: 0 })).toMatchObject({
      scale: 0,
      width: 0,
      height: 0,
    })
    expect(fitContain({ width: 0, height: 0 }, square).scale).toBe(0)
    expect(fitContain(square, { width: Number.NaN, height: 500 }).scale).toBe(0)
  })
})

describe('point conversion', () => {
  const fit: Fit = fitContain(square, { width: 1000, height: 400 })

  it('places the mockup origin at the fit offset', () => {
    expect(toStagePoint({ x: 0, y: 0 }, fit)).toEqual({ x: 300, y: 0 })
  })

  it('scales a point into stage pixels', () => {
    expect(toStagePoint({ x: 400, y: 800 }, fit)).toEqual({ x: 500, y: 400 })
  })

  it('round-trips a point back to mockup space', () => {
    const point = { x: 137, y: 642 }

    const roundTripped = toMockupPoint(toStagePoint(point, fit), fit)

    expect(roundTripped.x).toBeCloseTo(point.x)
    expect(roundTripped.y).toBeCloseTo(point.y)
  })

  it('answers the origin while there is no scale', () => {
    const empty = fitContain(square, { width: 0, height: 0 })

    expect(toMockupPoint({ x: 10, y: 10 }, empty)).toEqual({ x: 0, y: 0 })
  })
})

describe('pixelRatio', () => {
  it('keeps a retina screen sharp', () => {
    expect(pixelRatio(2)).toBe(2)
  })

  it('caps a phone that reports more than the canvas needs', () => {
    expect(pixelRatio(3.5)).toBe(2)
  })

  it('never renders below one device pixel per stage pixel', () => {
    expect(pixelRatio(0.75)).toBe(1)
  })

  it('falls back where the browser reports nothing', () => {
    expect(pixelRatio(undefined)).toBe(1)
  })
})
