import { describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makePattern } from '@/test/catalogFixtures'
import { MOTIF_UNIT } from './motifBox'
import {
  clampMotifCenter,
  MOTIF_MAX_RATIO,
  MOTIF_MIN_SIZE,
  MOTIF_PLACE_RATIO,
  motifPlacement,
  motifSizeBounds,
  newMotifLayer,
} from './motifPlacement'

/** The drawn length of a placed leaf's longer edge, in mockup units. */
const placedSize = (bounds: {
  x: number
  y: number
  width: number
  height: number
}) => motifPlacement(bounds).scale * MOTIF_UNIT

/** The handkerchief's corner: the smallest motif-only area in the catalog. */
const cornerBounds = { x: 556, y: 556, width: 234, height: 234 }

const corner: PrintArea = {
  id: 'corner',
  name: { th: 'TH Corner', en: 'Corner' },
  clip: { type: 'rect', ...cornerBounds },
  allowedKinds: ['motif'],
}

/** The shawl's end band: tall and narrow, so the two sides differ. */
const band = { x: 170, y: 268, width: 180, height: 464 }

const teak = makePattern({
  id: 'teak',
  kind: 'motif',
  defaultColors: ['#4B2A4F', '#A23B62'],
})

describe('motifPlacement', () => {
  it('is the middle of the area', () => {
    const { x, y } = motifPlacement(cornerBounds)

    expect([x, y]).toEqual([673, 673])
  })

  it('is a quarter of the shorter side where that clears the floor', () => {
    // The shawl's whole cloth: a quarter of 464 is 116, which stands.
    const cloth = { x: 170, y: 268, width: 660, height: 464 }

    expect(placedSize(cloth)).toBeCloseTo(MOTIF_PLACE_RATIO * 464, 10)
    expect(placedSize(cloth)).toBeGreaterThan(MOTIF_MIN_SIZE)
  })

  it('holds a small area at the floor, so a leaf is not a speck', () => {
    // The handkerchief's corner: a quarter of 234 is 58, which on a Pixel 7 is
    // smaller than the handles that hold it. The floor is what this is for.
    expect(placedSize(cornerBounds)).toBeCloseTo(MOTIF_MIN_SIZE, 10)
  })

  it('also holds the shawl narrow end band at the floor', () => {
    expect(placedSize(band)).toBeCloseTo(MOTIF_MIN_SIZE, 10)
  })

  it('gives the floor up where the area cannot hold it', () => {
    // 0.6 of 120 is 72, under the floor: a leaf that fits beats a leaf that
    // is never smaller than 100 units.
    const small = { x: 0, y: 0, width: 120, height: 120 }

    expect(placedSize(small)).toBeCloseTo(MOTIF_MAX_RATIO * 120, 10)
    expect(placedSize(small)).toBeLessThan(MOTIF_MIN_SIZE)
  })

  it('leaves a tiny area a motif that can still be grabbed', () => {
    const { scale } = motifPlacement({ x: 0, y: 0, width: 8, height: 8 })

    expect(scale).toBeGreaterThan(0)
  })
})

describe('motifSizeBounds', () => {
  it('runs from the floor to a share of the shorter side', () => {
    expect(motifSizeBounds(cornerBounds)).toEqual({
      min: MOTIF_MIN_SIZE,
      max: MOTIF_MAX_RATIO * 234,
    })
  })

  it('measures against the shorter side of an oblong area', () => {
    expect(motifSizeBounds(band).max).toBeCloseTo(MOTIF_MAX_RATIO * 180, 10)
  })

  it('drops the floor to the ceiling where an area is smaller than both', () => {
    const { min, max } = motifSizeBounds({
      x: 0,
      y: 0,
      width: 120,
      height: 120,
    })

    expect(min).toBe(max)
    expect(max).toBeCloseTo(MOTIF_MAX_RATIO * 120, 10)
  })

  it('never answers with a floor above its ceiling', () => {
    for (const side of [10, 80, 150, 166, 400, 900]) {
      const { min, max } = motifSizeBounds({
        x: 0,
        y: 0,
        width: side,
        height: side,
      })

      expect(min).toBeLessThanOrEqual(max)
    }
  })
})

describe('clampMotifCenter', () => {
  const bounds = { x: 100, y: 200, width: 300, height: 400 }

  it('leaves a centre already inside alone', () => {
    expect(clampMotifCenter({ x: 250, y: 400 }, bounds)).toEqual({
      x: 250,
      y: 400,
    })
  })

  it('holds a centre dragged past an edge at that edge', () => {
    expect(clampMotifCenter({ x: -500, y: 10_000 }, bounds)).toEqual({
      x: 100,
      y: 600,
    })
  })

  it('allows the very corners, where a leaf on a hem belongs', () => {
    expect(clampMotifCenter({ x: 400, y: 600 }, bounds)).toEqual({
      x: 400,
      y: 600,
    })
  })

  it('clamps each axis on its own', () => {
    expect(clampMotifCenter({ x: 250, y: -40 }, bounds)).toEqual({
      x: 250,
      y: 200,
    })
  })
})

describe('newMotifLayer', () => {
  it('is centred in the area, upright and at full strength', () => {
    expect(newMotifLayer(teak, corner)).toMatchObject({
      type: 'motif',
      patternId: 'teak',
      printAreaId: 'corner',
      x: 673,
      y: 673,
      rotation: 0,
      opacity: 1,
    })
  })

  it('takes the pattern own colours without sharing the catalog array', () => {
    const layer = newMotifLayer(teak, corner)

    expect(layer.colors).toEqual(teak.defaultColors)
    layer.colors.push('#000000')
    expect(teak.defaultColors).toEqual(['#4B2A4F', '#A23B62'])
  })

  it('measures a path area as well as a rectangle one', () => {
    const face: PrintArea = {
      ...corner,
      id: 'face',
      clip: {
        type: 'path',
        d: 'M200 500A300 300 0 1 1 800 500A300 300 0 1 1 200 500Z',
      },
    }

    expect(newMotifLayer(teak, face)).toMatchObject({ x: 500, y: 500 })
  })
})
