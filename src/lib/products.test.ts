import { describe, expect, it } from 'vitest'
import type { Product } from '@/catalog'
import { makeProduct } from '@/test/catalogFixtures'
import {
  filterProductsByLine,
  isBestseller,
  parseProductLine,
  sortProductsForPicker,
} from './products'

const ids = (products: readonly Product[]) =>
  products.map((product) => product.id)

describe('isBestseller', () => {
  it('reads the tag off the product', () => {
    expect(isBestseller(makeProduct({ tags: ['bestseller'] }))).toBe(true)
    expect(isBestseller(makeProduct({ tags: ['gift', 'bestseller'] }))).toBe(
      true,
    )
  })

  it('is false without the tag', () => {
    expect(isBestseller(makeProduct({ tags: [] }))).toBe(false)
    expect(isBestseller(makeProduct({ tags: ['best-seller'] }))).toBe(false)
  })
})

describe('parseProductLine', () => {
  it('accepts every line in the model', () => {
    expect(parseProductLine('fabric')).toBe('fabric')
    expect(parseProductLine('leaf')).toBe('leaf')
    expect(parseProductLine('gift')).toBe('gift')
    expect(parseProductLine('drinkware')).toBe('drinkware')
  })

  it('rejects anything else, so a bad URL falls back to all', () => {
    expect(parseProductLine(null)).toBeNull()
    expect(parseProductLine('')).toBeNull()
    expect(parseProductLine('Fabric')).toBeNull()
    expect(parseProductLine('socks')).toBeNull()
  })
})

describe('filterProductsByLine', () => {
  const products = [
    makeProduct({ id: 'handkerchief', line: 'fabric' }),
    makeProduct({ id: 'leaf-plate', line: 'leaf' }),
    makeProduct({ id: 'fan', line: 'gift' }),
  ]

  it('keeps only the asked-for line', () => {
    expect(ids(filterProductsByLine(products, 'leaf'))).toEqual(['leaf-plate'])
  })

  it('keeps everything for null', () => {
    expect(ids(filterProductsByLine(products, null))).toEqual(ids(products))
  })

  it('returns nothing for a line no product is in', () => {
    expect(filterProductsByLine(products, 'drinkware')).toEqual([])
  })

  it('does not mutate the input', () => {
    const input = [...products]
    filterProductsByLine(input, 'leaf')

    expect(ids(input)).toEqual(ids(products))
  })
})

describe('sortProductsForPicker', () => {
  const available = (id: string, tags: string[] = []) =>
    makeProduct({ id, status: 'available', tags })
  const planned = (id: string, tags: string[] = []) =>
    makeProduct({ id, status: 'planned', price: null, tags })

  it('puts best sellers first and planned products last', () => {
    const sorted = sortProductsForPicker([
      available('shawl-silk'),
      planned('mug'),
      available('handkerchief', ['bestseller']),
      available('fan'),
    ])

    expect(ids(sorted)).toEqual(['handkerchief', 'shawl-silk', 'fan', 'mug'])
  })

  it('keeps a planned product last even when it is tagged a best seller', () => {
    const sorted = sortProductsForPicker([
      planned('mug', ['bestseller']),
      available('fan'),
    ])

    expect(ids(sorted)).toEqual(['fan', 'mug'])
  })

  it('keeps catalog order inside a rank', () => {
    const sorted = sortProductsForPicker([
      available('shawl-cotton', ['bestseller']),
      available('shawl-silk'),
      available('handkerchief', ['bestseller']),
      available('fan'),
      planned('mug'),
      planned('tumbler'),
    ])

    expect(ids(sorted)).toEqual([
      'shawl-cotton',
      'handkerchief',
      'shawl-silk',
      'fan',
      'mug',
      'tumbler',
    ])
  })

  it('does not mutate the input', () => {
    const input = [available('fan'), available('handkerchief', ['bestseller'])]
    sortProductsForPicker(input)

    expect(ids(input)).toEqual(['fan', 'handkerchief'])
  })
})
