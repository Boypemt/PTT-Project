/**
 * What these pin down is the contract the canvas cannot show in a unit test:
 * the rectangle stays still and covers the mockup, the fill carries the
 * layer's scale, rotation and offset, and scale 1 means the tile's natural
 * size however large the raster behind it is.
 */
import { describe, expect, it } from 'vitest'
import type { ProductMockup, TileLayer } from '@/catalog'
import { tileFill } from './tileFill'

const mockup: ProductMockup = {
  base: '/catalog/products/shawl-cotton-base.svg',
  width: 1000,
  height: 1000,
}

const makeLayer = (overrides: Partial<TileLayer> = {}): TileLayer => ({
  id: 'layer-1',
  type: 'tile',
  patternId: 'seigaiha',
  printAreaId: 'cloth',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
  ...overrides,
})

describe('tileFill', () => {
  it('covers the whole mockup from its origin', () => {
    const fill = tileFill(makeLayer(), mockup, 1)

    expect(fill).toMatchObject({ x: 0, y: 0, width: 1000, height: 1000 })
    expect(fill.fillPatternRepeat).toBe('repeat')
  })

  it('draws the tile at its natural size at scale 1', () => {
    const fill = tileFill(makeLayer(), mockup, 1)

    expect(fill.fillPatternScaleX).toBe(1)
    expect(fill.fillPatternScaleY).toBe(1)
  })

  it('divides out the raster so a sharper tile is not a bigger tile', () => {
    const fill = tileFill(makeLayer(), mockup, 2)

    expect(fill.fillPatternScaleX).toBe(0.5)
    expect(fill.fillPatternScaleY).toBe(0.5)
  })

  it('scales the fill by the layer, raster and all', () => {
    expect(tileFill(makeLayer({ scale: 3 }), mockup, 2).fillPatternScaleX).toBe(
      1.5,
    )
    expect(
      tileFill(makeLayer({ scale: 0.2 }), mockup, 2).fillPatternScaleX,
    ).toBe(0.1)
  })

  it('keeps a broken scale drawable instead of collapsing the pattern', () => {
    expect(
      tileFill(makeLayer({ scale: 0 }), mockup, 2).fillPatternScaleX,
    ).toBeGreaterThan(0)
    expect(
      tileFill(makeLayer({ scale: -4 }), mockup, 2).fillPatternScaleX,
    ).toBeGreaterThan(0)
    expect(tileFill(makeLayer(), mockup, 0).fillPatternScaleX).toBeGreaterThan(
      0,
    )
  })

  it('turns and shifts the fill, never the rectangle', () => {
    const fill = tileFill(
      makeLayer({ rotation: 45, offsetX: 120, offsetY: -30 }),
      mockup,
      2,
    )

    expect(fill.fillPatternRotation).toBe(45)
    expect(fill.fillPatternX).toBe(120)
    expect(fill.fillPatternY).toBe(-30)
    // The shape itself is where it was: a rotated rectangle would pull its
    // corners out of the print area and leave the cloth bare.
    expect(fill).toMatchObject({ x: 0, y: 0, width: 1000, height: 1000 })
  })

  it('passes the layer opacity through', () => {
    expect(tileFill(makeLayer({ opacity: 0.4 }), mockup, 2).opacity).toBe(0.4)
  })
})
