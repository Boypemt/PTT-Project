import { describe, expect, it } from 'vitest'
import type { Design, Layer } from '@/catalog'
import { replaceableLayer } from './selection'

const tile = (id: string, printAreaId: string): Layer => ({
  id,
  type: 'tile',
  patternId: 'seigaiha',
  printAreaId,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
})

const motif = (id: string, printAreaId: string): Layer => ({
  id,
  type: 'motif',
  patternId: 'teak',
  printAreaId,
  x: 100,
  y: 100,
  scale: 1,
  rotation: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
})

const design = (layers: Layer[]): Design => ({
  version: 1,
  productId: 'shawl-cotton',
  baseColor: '#F3EADA',
  layers,
})

describe('replaceableLayer', () => {
  it('is the selected tile when a tile is tapped on the area it prints on', () => {
    const layers = [tile('a', 'cloth'), tile('b', 'cloth')]

    expect(replaceableLayer(design(layers), 'b', 'cloth', 'tile')?.id).toBe('b')
  })

  it('is the selected motif when a motif is tapped — the same rule as tiles', () => {
    const layers = [motif('leaf', 'corner')]

    expect(
      replaceableLayer(design(layers), 'leaf', 'corner', 'motif')?.id,
    ).toBe('leaf')
  })

  it('is nothing when no layer is selected, so the tap starts one', () => {
    expect(
      replaceableLayer(design([tile('a', 'cloth')]), null, 'cloth', 'tile'),
    ).toBe(undefined)
  })

  it('is nothing when the selected layer prints somewhere else', () => {
    const layers = [tile('a', 'end-band'), motif('leaf', 'corner')]

    expect(replaceableLayer(design(layers), 'a', 'cloth', 'tile')).toBe(
      undefined,
    )
    expect(replaceableLayer(design(layers), 'leaf', 'cloth', 'motif')).toBe(
      undefined,
    )
  })

  it('is nothing across kinds, which are not interchangeable', () => {
    const layers = [tile('a', 'cloth'), motif('leaf', 'cloth')]

    // A leaf is selected and a tile is tapped: that adds a tile rather than
    // turning the leaf into one, and the other way round too.
    expect(replaceableLayer(design(layers), 'leaf', 'cloth', 'tile')).toBe(
      undefined,
    )
    expect(replaceableLayer(design(layers), 'a', 'cloth', 'motif')).toBe(
      undefined,
    )
  })

  it('answers with the selected layer of either kind when no kind is given', () => {
    const layers = [tile('a', 'cloth'), motif('leaf', 'cloth')]

    expect(replaceableLayer(design(layers), 'a', 'cloth')?.id).toBe('a')
    expect(replaceableLayer(design(layers), 'leaf', 'cloth')?.id).toBe('leaf')
  })

  it('is nothing when the selection names a layer the design lost', () => {
    expect(replaceableLayer(design([]), 'gone', 'cloth', 'tile')).toBe(
      undefined,
    )
  })
})
