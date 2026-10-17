import { describe, expect, it } from 'vitest'
import type { Pattern } from '@/catalog'
import { makePattern, makeProduct } from '@/test/catalogFixtures'
import { allowsProduct, filterPatterns } from './patternFilter'

const community = {
  type: 'community',
  credit: 'Designer TBC',
  license: 'Community-owned — terms TBC',
} as const

const seigaiha = makePattern({
  id: 'seigaiha',
  name: { th: 'ลายคลื่น', en: 'Seigaiha waves' },
  tags: ['geometric', 'waves'],
})
const gingham = makePattern({
  id: 'gingham',
  name: { th: 'ลายตารางกิงแฮม', en: 'Gingham check' },
  tags: ['geometric', 'check'],
})
const teak = makePattern({
  id: 'teak',
  kind: 'motif',
  name: { th: 'ใบสัก', en: 'Teak leaf' },
  tags: ['leaf', 'eco-print'],
})

const patterns = [seigaiha, gingham, teak]

const inEnglish = (pattern: Pattern) => pattern.name.en
const inThai = (pattern: Pattern) => pattern.name.th

const ids = (found: Pattern[]) => found.map((pattern) => pattern.id)

describe('filterPatterns', () => {
  it('shows every pattern of an offered kind when nothing is typed', () => {
    const found = filterPatterns(
      patterns,
      { query: '', kinds: ['tile'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['seigaiha', 'gingham'])
  })

  it('leaves out a kind the print area will not take', () => {
    const found = filterPatterns(
      patterns,
      { query: '', kinds: ['motif'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['teak'])
  })

  it('matches part of a name, ignoring case and stray spaces', () => {
    const found = filterPatterns(
      patterns,
      { query: '  GINGham ', kinds: ['tile', 'motif'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['gingham'])
  })

  it('searches the name in the language on screen', () => {
    const query = 'ตาราง'
    const kinds = ['tile', 'motif'] as const

    expect(ids(filterPatterns(patterns, { query, kinds }, inThai))).toEqual([
      'gingham',
    ])
    expect(filterPatterns(patterns, { query, kinds }, inEnglish)).toEqual([])
  })

  it('matches a tag, which is where "waves" is written down', () => {
    const found = filterPatterns(
      patterns,
      { query: 'waves', kinds: ['tile'] },
      inThai,
    )

    expect(ids(found)).toEqual(['seigaiha'])
  })

  it('comes back empty rather than guessing', () => {
    const found = filterPatterns(
      patterns,
      { query: 'tartan', kinds: ['tile', 'motif'] },
      inEnglish,
    )

    expect(found).toEqual([])
  })

  it('keeps the catalog order within a group', () => {
    const found = filterPatterns(
      [gingham, seigaiha],
      { query: '', kinds: ['tile'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['gingham', 'seigaiha'])
  })

  it('lists the community patterns before the placeholders', () => {
    const lemons = makePattern({ id: 'lemons', source: community })
    const stars = makePattern({ id: 'stars', source: community })
    const found = filterPatterns(
      [seigaiha, lemons, gingham, stars],
      { query: '', kinds: ['tile'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['lemons', 'stars', 'seigaiha', 'gingham'])
  })

  it('leaves out a pattern this product may not be printed with', () => {
    const plateOnly = makePattern({
      id: 'plate-rim',
      restrictTo: { lines: ['leaf'] },
    })
    const found = filterPatterns(
      [seigaiha, plateOnly],
      { query: '', kinds: ['tile'], product: makeProduct({ line: 'fabric' }) },
      inEnglish,
    )

    expect(ids(found)).toEqual(['seigaiha'])
  })
})

describe('allowsProduct', () => {
  const shawl = makeProduct({ id: 'shawl-cotton', line: 'fabric' })
  const plate = makeProduct({ id: 'leaf-plate', line: 'leaf' })

  it('prints a pattern with no restriction on anything', () => {
    expect(allowsProduct(makePattern(), shawl)).toBe(true)
    expect(allowsProduct(makePattern(), plate)).toBe(true)
  })

  it('allows a whole product line', () => {
    const pattern = makePattern({ restrictTo: { lines: ['fabric'] } })

    expect(allowsProduct(pattern, shawl)).toBe(true)
    expect(allowsProduct(pattern, plate)).toBe(false)
  })

  it('allows a named product even outside the lines it names', () => {
    const pattern = makePattern({
      restrictTo: { lines: ['fabric'], productIds: ['leaf-plate'] },
    })

    expect(allowsProduct(pattern, plate)).toBe(true)
  })

  it('offers the pattern where there is no product to judge it against', () => {
    const pattern = makePattern({ restrictTo: { lines: ['leaf'] } })

    expect(allowsProduct(pattern, undefined)).toBe(true)
  })
})
