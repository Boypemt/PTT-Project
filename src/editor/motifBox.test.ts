import { describe, expect, it } from 'vitest'
import type { MotifLayer } from '@/catalog'
import {
  clampMotifScale,
  MOTIF_SCALE,
  MOTIF_UNIT,
  motifBox,
  motifSize,
  normalizeRotation,
} from './motifBox'

const layer = (overrides: Partial<MotifLayer> = {}): MotifLayer => ({
  id: 'motif-1',
  type: 'motif',
  patternId: 'teak',
  printAreaId: 'corner',
  x: 300,
  y: 400,
  scale: 1,
  rotation: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
  ...overrides,
})

describe('MOTIF_UNIT', () => {
  /**
   * Pinned on purpose. `scale` is stored in the design, so it is carried by
   * autosave and by a share link, and this number is what a scale means. Change
   * it and every leaf in every design anyone has already saved comes out a
   * different size — which is a migration, not an edit.
   */
  it('is 220 mockup units, the scale every saved design is written against', () => {
    expect(MOTIF_UNIT).toBe(220)
  })
})

describe('motifSize', () => {
  it('puts scale 1 at MOTIF_UNIT on the longer edge', () => {
    expect(motifSize(1, 1)).toEqual({ width: MOTIF_UNIT, height: MOTIF_UNIT })
  })

  it('scales both edges together', () => {
    expect(motifSize(0.5, 1)).toEqual({ width: 110, height: 110 })
    expect(motifSize(2, 1)).toEqual({ width: 440, height: 440 })
  })

  it('keeps the asset aspect ratio, whichever edge is longer', () => {
    expect(motifSize(1, 2)).toEqual({ width: 220, height: 110 })
    expect(motifSize(1, 0.5)).toEqual({ width: 110, height: 220 })
  })

  it('takes an unmeasured asset as square rather than drawing nothing', () => {
    for (const aspect of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(motifSize(1, aspect)).toEqual({
        width: MOTIF_UNIT,
        height: MOTIF_UNIT,
      })
    }
  })
})

describe('clampMotifScale', () => {
  it('leaves a scale a slider or a handle can ask for alone', () => {
    expect(clampMotifScale(0.4)).toBe(0.4)
  })

  it('holds the ends, so a hand-edited design cannot vanish or swamp the page', () => {
    expect(clampMotifScale(0)).toBe(MOTIF_SCALE.min)
    expect(clampMotifScale(-3)).toBe(MOTIF_SCALE.min)
    expect(clampMotifScale(50)).toBe(MOTIF_SCALE.max)
  })

  it('falls back to 1 for a scale that is not a number', () => {
    expect(clampMotifScale(Number.NaN)).toBe(1)
  })
})

describe('normalizeRotation', () => {
  it('leaves an angle already in range alone', () => {
    expect(normalizeRotation(0)).toBe(0)
    expect(normalizeRotation(45)).toBe(45)
  })

  it('brings an anticlockwise turn back into 0–360, as Konva hands it over', () => {
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(-405)).toBe(315)
  })

  it('wraps a turn past the full circle', () => {
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(450)).toBe(90)
  })

  it('falls back to upright for an angle that is not a number', () => {
    expect(normalizeRotation(Number.NaN)).toBe(0)
  })
})

describe('motifBox', () => {
  it('centres the motif on its own point', () => {
    const box = motifBox(layer({ scale: 1 }), 1)

    expect(box).toMatchObject({ x: 300, y: 400, offsetX: 110, offsetY: 110 })
  })

  it('offsets by half of each edge, so a wide leaf still turns on its centre', () => {
    const box = motifBox(layer(), 2)

    expect(box).toMatchObject({
      width: 220,
      height: 110,
      offsetX: 110,
      offsetY: 55,
    })
  })

  it('carries the rotation and the strength through', () => {
    const box = motifBox(layer({ rotation: -45, opacity: 0.6 }), 1)

    expect(box).toMatchObject({ rotation: 315, opacity: 0.6 })
  })
})
