/**
 * What a placement pattern has to get right: it covers the print area at
 * scale 1 whatever shape the area is, it keeps the drawing's proportions, and
 * it turns about its own middle rather than about a corner.
 */
import { describe, expect, it } from 'vitest'
import type { TileLayer } from '@/catalog'
import type { Rect } from '@/lib/geometry'
import { areaFill } from './areaFill'

/** The handkerchief's cloth area, which is square. */
const square: Rect = { x: 210, y: 210, width: 580, height: 580 }

/** The shawl's cloth area, which is a wide band. */
const band: Rect = { x: 170, y: 268, width: 660, height: 464 }

const makeLayer = (overrides: Partial<TileLayer> = {}): TileLayer => ({
  id: 'layer-1',
  type: 'tile',
  patternId: 'hearts',
  printAreaId: 'cloth',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  colors: [],
  opacity: 1,
  ...overrides,
})

describe('areaFill', () => {
  it('covers a square area with a square picture exactly', () => {
    const fill = areaFill(makeLayer(), square, 1)

    expect(fill).toMatchObject({ width: 580, height: 580 })
    // Centred on the area, with the origin in the middle of the picture.
    expect(fill).toMatchObject({ x: 500, y: 500, offsetX: 290, offsetY: 290 })
  })

  it('overflows the short side rather than leaving cloth bare', () => {
    // A portrait picture (2480x3508) on a wide band: it is as wide as the
    // band and taller than it, and the clip trims the rest.
    const fill = areaFill(makeLayer(), band, 2480 / 3508)

    expect(fill.width).toBe(660)
    expect(fill.height).toBeGreaterThan(band.height)
    expect(fill.width / fill.height).toBeCloseTo(2480 / 3508, 5)
  })

  it('covers the other way round for a picture wider than the area', () => {
    const fill = areaFill(makeLayer(), square, 2)

    expect(fill.height).toBe(580)
    expect(fill.width).toBe(1160)
  })

  it('grows and shrinks with the layer scale', () => {
    expect(areaFill(makeLayer({ scale: 2 }), square, 1).width).toBe(1160)
    expect(areaFill(makeLayer({ scale: 0.5 }), square, 1).width).toBe(290)
  })

  it('keeps a broken scale drawable', () => {
    expect(areaFill(makeLayer({ scale: 0 }), square, 1).width).toBeGreaterThan(
      0,
    )
    expect(areaFill(makeLayer({ scale: -3 }), square, 1).width).toBeGreaterThan(
      0,
    )
  })

  it('moves by the layer offsets, in mockup units', () => {
    const fill = areaFill(makeLayer({ offsetX: 40, offsetY: -25 }), square, 1)

    expect(fill).toMatchObject({ x: 540, y: 475 })
  })

  it('turns about the middle of the picture', () => {
    const fill = areaFill(makeLayer({ rotation: 30 }), square, 1)

    expect(fill.rotation).toBe(30)
    expect(fill.offsetX).toBe(fill.width / 2)
    expect(fill.offsetY).toBe(fill.height / 2)
  })

  it('passes the layer opacity through', () => {
    expect(areaFill(makeLayer({ opacity: 0.4 }), square, 1).opacity).toBe(0.4)
  })

  it('fills the area with a square when the asset cannot be measured', () => {
    const fill = areaFill(makeLayer(), band, 0)

    expect(fill).toMatchObject({ width: 660, height: 660 })
  })
})
