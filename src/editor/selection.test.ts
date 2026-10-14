import { describe, expect, it } from 'vitest'
import type { Design, Layer } from '@/catalog'
import { replaceableTile } from './selection'

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

const motif: Layer = {
  id: 'motif-1',
  type: 'motif',
  patternId: 'teak',
  printAreaId: 'cloth',
  x: 100,
  y: 100,
  scale: 1,
  rotation: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
}

const design = (layers: Layer[]): Design => ({
  version: 1,
  productId: 'shawl-cotton',
  baseColor: '#F3EADA',
  layers,
})

describe('replaceableTile', () => {
  it('is the selected tile when it prints on the area being worked on', () => {
    const layers = [tile('a', 'cloth'), tile('b', 'cloth')]

    expect(replaceableTile(design(layers), 'b', 'cloth')?.id).toBe('b')
  })

  it('is nothing when no layer is selected, so the tap starts one', () => {
    expect(replaceableTile(design([tile('a', 'cloth')]), null, 'cloth')).toBe(
      undefined,
    )
  })

  it('is nothing when the selected tile prints somewhere else', () => {
    const layers = [tile('a', 'end-band')]

    expect(replaceableTile(design(layers), 'a', 'cloth')).toBe(undefined)
  })

  it('is nothing for a selected motif, which a tile cannot replace', () => {
    expect(replaceableTile(design([motif]), motif.id, 'cloth')).toBe(undefined)
  })

  it('is nothing when the selection names a layer the design lost', () => {
    expect(replaceableTile(design([]), 'gone', 'cloth')).toBe(undefined)
  })
})
