import { describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makePattern } from '@/test/catalogFixtures'
import { MOTIF_UNIT } from './motifBox'
import {
  clampMotifCenter,
  MOTIF_PLACE_RATIO,
  motifPlacement,
  newMotifLayer,
} from './motifPlacement'

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

  it('is a quarter of the shorter side, so a narrow area is not overflowed', () => {
    const { scale } = motifPlacement(band)

    expect(scale).toBeCloseTo((MOTIF_PLACE_RATIO * band.width) / MOTIF_UNIT, 10)
    // The leaf comes out 45 units across on a band 180 wide.
    expect(scale * MOTIF_UNIT).toBeCloseTo(45, 10)
  })

  it('leaves a tiny area a motif that can still be grabbed', () => {
    const { scale } = motifPlacement({ x: 0, y: 0, width: 8, height: 8 })

    expect(scale).toBeGreaterThan(0)
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
