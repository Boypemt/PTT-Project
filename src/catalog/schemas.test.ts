import { describe, expect, it } from 'vitest'
import { makeLeafDye, makePattern, makeProduct } from '@/test/catalogFixtures'
import {
  leafDyeSchema,
  patternSchema,
  priceSchema,
  productSchema,
} from './schemas'

describe('leafDyeSchema', () => {
  it('accepts a valid leaf dye', () => {
    expect(leafDyeSchema.safeParse(makeLeafDye()).success).toBe(true)
  })

  it('rejects a colour that is not hex', () => {
    const result = leafDyeSchema.safeParse(
      makeLeafDye({
        colors: [
          {
            id: 'deep-purple',
            name: { th: 'ม่วง', en: 'Purple' },
            hex: 'purple',
          },
        ],
      }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['colors', 0, 'hex'])
    expect(result.error?.issues[0]?.message).toContain('hex colour')
  })

  it('rejects an id that is not kebab-case', () => {
    const result = leafDyeSchema.safeParse(makeLeafDye({ id: 'Golden Teak' }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('kebab-case')
  })

  it('rejects an unknown key so typos cannot pass silently', () => {
    const result = leafDyeSchema.safeParse({ ...makeLeafDye(), colours: [] })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('colours')
  })
})

describe('patternSchema', () => {
  it('accepts a valid pattern', () => {
    expect(patternSchema.safeParse(makePattern()).success).toBe(true)
  })

  it('rejects an asset path outside /catalog/', () => {
    const result = patternSchema.safeParse(
      makePattern({ src: 'https://example.com/pattern.svg' }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['src'])
  })

  it('rejects a recolorable pattern with no default colours', () => {
    const result = patternSchema.safeParse(
      makePattern({ recolorable: true, defaultColors: [] }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['defaultColors'])
  })

  it('allows a non-recolorable pattern with no default colours', () => {
    const result = patternSchema.safeParse(
      makePattern({ recolorable: false, defaultColors: [] }),
    )

    expect(result.success).toBe(true)
  })

  it('accepts a tile with a repeat size in mockup units', () => {
    const result = patternSchema.safeParse(
      makePattern({ kind: 'tile', repeatUnits: 500 }),
    )

    expect(result.success).toBe(true)
  })

  it('rejects a repeat size of zero or less', () => {
    const result = patternSchema.safeParse(makePattern({ repeatUnits: 0 }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['repeatUnits'])
  })

  it('accepts a tile that fills the print area once', () => {
    const result = patternSchema.safeParse(
      makePattern({ kind: 'tile', fit: 'area' }),
    )

    expect(result.success).toBe(true)
  })

  it('rejects a repeat size on a pattern that fills the area once', () => {
    const result = patternSchema.safeParse(
      makePattern({ kind: 'tile', fit: 'area', repeatUnits: 500 }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['repeatUnits'])
  })

  it('rejects a fit on a motif, which is placed one at a time', () => {
    const result = patternSchema.safeParse(
      makePattern({ kind: 'motif', fit: 'area' }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['fit'])
  })

  it('accepts a restriction to a product line', () => {
    const result = patternSchema.safeParse(
      makePattern({ restrictTo: { lines: ['fabric'] } }),
    )

    expect(result.success).toBe(true)
  })

  it('rejects a restriction that names nothing', () => {
    const result = patternSchema.safeParse(makePattern({ restrictTo: {} }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('omit restrictTo')
  })

  it('rejects a product line it has never heard of', () => {
    const result = patternSchema.safeParse({
      ...makePattern(),
      restrictTo: { lines: ['ceramics'] },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['restrictTo', 'lines', 0])
  })
})

describe('productSchema', () => {
  it('accepts a valid product', () => {
    expect(productSchema.safeParse(makeProduct()).success).toBe(true)
  })

  it('accepts a null price for a planned product', () => {
    const result = productSchema.safeParse(
      makeProduct({
        id: 'mug',
        line: 'drinkware',
        price: null,
        status: 'planned',
      }),
    )

    expect(result.success).toBe(true)
  })

  it('requires at least one print area', () => {
    const result = productSchema.safeParse(makeProduct({ printAreas: [] }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['printAreas'])
  })

  it('defaults tags to an empty array when the file omits them', () => {
    const untagged: Record<string, unknown> = { ...makeProduct() }
    delete untagged.tags
    const result = productSchema.safeParse(untagged)

    expect(result.data?.tags).toEqual([])
  })

  it('keeps the tags a product carries', () => {
    const result = productSchema.safeParse(
      makeProduct({ tags: ['bestseller'] }),
    )

    expect(result.data?.tags).toEqual(['bestseller'])
  })
})

describe('priceSchema', () => {
  it('accepts a range', () => {
    expect(
      priceSchema.safeParse({ min: 59, max: 89, currency: 'THB' }).success,
    ).toBe(true)
  })

  it('rejects a max below the min', () => {
    const result = priceSchema.safeParse({ min: 89, max: 59, currency: 'THB' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['max'])
  })
})
