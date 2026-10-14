import { describe, expect, it } from 'vitest'
import { makePattern, makeProduct } from '@/test/catalogFixtures'
import { pickHeroPattern, pickHeroProduct } from './hero'

describe('pickHeroProduct', () => {
  it('leads with an available best seller', () => {
    const product = pickHeroProduct([
      makeProduct({ id: 'mug', status: 'planned', tags: ['bestseller'] }),
      makeProduct({ id: 'fan', tags: [] }),
      makeProduct({ id: 'shawl-cotton', tags: ['bestseller'] }),
    ])

    expect(product?.id).toBe('shawl-cotton')
  })

  it('keeps catalog order between products that rank the same', () => {
    const product = pickHeroProduct([
      makeProduct({ id: 'handkerchief', tags: ['bestseller'] }),
      makeProduct({ id: 'shawl-cotton', tags: ['bestseller'] }),
    ])

    expect(product?.id).toBe('handkerchief')
  })

  it('falls back to whatever the catalog has', () => {
    expect(pickHeroProduct([makeProduct({ id: 'fan', tags: [] })])?.id).toBe(
      'fan',
    )
    expect(pickHeroProduct([])).toBeUndefined()
  })
})

describe('pickHeroPattern', () => {
  it('prefers an eco-print tile', () => {
    const pattern = pickHeroPattern([
      makePattern({ id: 'polka', tags: ['geometric'] }),
      makePattern({ id: 'eco-print-scatter', tags: ['eco-print', 'leaf'] }),
    ])

    expect(pattern?.id).toBe('eco-print-scatter')
  })

  it('never picks a motif, which does not repeat', () => {
    const pattern = pickHeroPattern([
      makePattern({ id: 'teak', kind: 'motif', tags: ['eco-print'] }),
      makePattern({ id: 'polka', tags: ['geometric'] }),
    ])

    expect(pattern?.id).toBe('polka')
  })

  it('has nothing to show without a tile', () => {
    expect(pickHeroPattern([makePattern({ kind: 'motif' })])).toBeUndefined()
    expect(pickHeroPattern([])).toBeUndefined()
  })
})
