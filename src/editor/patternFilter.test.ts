import { describe, expect, it } from 'vitest'
import type { Pattern } from '@/catalog'
import { makePattern } from '@/test/catalogFixtures'
import { filterPatterns } from './patternFilter'

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

  it('keeps the catalog order', () => {
    const found = filterPatterns(
      [gingham, seigaiha],
      { query: '', kinds: ['tile'] },
      inEnglish,
    )

    expect(ids(found)).toEqual(['gingham', 'seigaiha'])
  })
})
