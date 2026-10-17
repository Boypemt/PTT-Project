/**
 * The promise this file makes is that importing a pattern leaves every
 * hand-written entry exactly as it was — same text, same order, same
 * formatting — so these check the untouched entries byte for byte, not just
 * that the JSON still parses to the same thing.
 */
import { describe, expect, it } from 'vitest'
import {
  communityItems,
  entryValue,
  isCommunity,
  renderEntry,
  rewriteCommunityEntries,
  splitItems,
  type CommunityEntry,
} from './patternsFile.ts'

const placeholder = `    {
      "id": "seigaiha",
      "name": { "th": "ลายคลื่น", "en": "Seigaiha waves" },
      "kind": "tile",
      "src": "/catalog/patterns/seigaiha.svg",
      "recolorable": true,
      "defaultColors": ["#4B2A4F"],
      "tags": ["geometric", "placeholder"],
      "source": {
        "type": "placeholder",
        "credit": "Generated placeholder",
        "license": "CC0-1.0"
      }
    }`

const community = `    {
      "id": "lemons",
      "name": { "th": "ลายมะนาว", "en": "Lemons" },
      "kind": "tile",
      "src": "/catalog/patterns/community/lemons.0a0a0a0a.webp",
      "thumbnail": "/catalog/patterns/community/lemons.0a0a0a0a-thumb.webp",
      "recolorable": false,
      "repeatUnits": 500,
      "defaultColors": [],
      "tags": ["community"],
      "source": {
        "type": "community",
        "credit": "Designer TBC",
        "license": "Community-owned — terms TBC"
      }
    }`

const file = (...items: string[]) =>
  `{\n  "catalogVersion": 1,\n  "items": [\n${items.join(',\n')}\n  ]\n}\n`

const entry = (overrides: Partial<CommunityEntry> = {}): CommunityEntry => ({
  id: 'lemons',
  name: { th: 'ลายมะนาว', en: 'Lemons' },
  src: '/catalog/patterns/community/lemons.0a0a0a0a.webp',
  thumbnail: '/catalog/patterns/community/lemons.0a0a0a0a-thumb.webp',
  repeatUnits: 500,
  tags: ['community'],
  credit: 'Designer TBC',
  license: 'Community-owned — terms TBC',
  ...overrides,
})

describe('splitItems', () => {
  it('hands back each entry as its own slice of source', () => {
    const { items } = splitItems(file(placeholder, community))

    expect(items).toHaveLength(2)
    expect(items[0]?.text).toBe(placeholder.trimStart())
    expect(items[1]?.text).toBe(community.trimStart())
  })

  it('is not confused by braces and brackets inside strings', () => {
    const awkward = `    {
      "id": "odd",
      "name": { "th": "}", "en": "] \\" [" },
      "source": { "type": "placeholder" }
    }`
    const { items } = splitItems(file(awkward, community))

    expect(items).toHaveLength(2)
    expect(items[0]?.text).toBe(awkward.trimStart())
  })

  it('refuses a file with no items array rather than guessing', () => {
    expect(() => splitItems('{ "catalogVersion": 1 }')).toThrow('"items"')
  })
})

describe('isCommunity', () => {
  it('tells the generated entries from the hand-written ones', () => {
    const { items } = splitItems(file(placeholder, community))

    expect(items.map((item) => isCommunity(item.value))).toEqual([false, true])
  })
})

describe('renderEntry', () => {
  it('writes the value entryValue describes', () => {
    // The two have to agree: one is compared against the catalog, the other is
    // what lands in it.
    const rendered: unknown = JSON.parse(renderEntry(entry()))

    expect(rendered).toEqual(entryValue(entry()))
  })

  it('carries the optional fields only when they are there', () => {
    const plain = renderEntry(entry({ repeatUnits: undefined }))

    expect(plain).not.toContain('repeatUnits')
    expect(plain).not.toContain('fit')
    expect(plain).not.toContain('restrictTo')

    const placed = renderEntry(
      entry({
        repeatUnits: undefined,
        fit: 'area',
        restrictTo: { lines: ['fabric'] },
      }),
    )

    expect(placed).toContain('"fit": "area"')
    expect(placed).toContain('"restrictTo"')
  })
})

describe('rewriteCommunityEntries', () => {
  it('leaves a placeholder entry untouched, to the character', async () => {
    const before = file(placeholder, community)
    const after = await rewriteCommunityEntries(before, [
      entry({ name: { th: 'ลายมะนาวใหม่', en: 'Lemons, revised' } }),
    ])

    expect(after).toContain(placeholder)
    expect(after).toContain('Lemons, revised')
  })

  it('writes the entries in the manifest order, after the placeholders', async () => {
    const after = await rewriteCommunityEntries(file(community, placeholder), [
      entry({ id: 'stars' }),
      entry({ id: 'lemons' }),
    ])
    const ids = [...after.matchAll(/"id": "([^"]+)"/g)].map((match) => match[1])

    expect(ids).toEqual(['seigaiha', 'stars', 'lemons'])
  })

  it('drops the community entries the manifest no longer has', async () => {
    const after = await rewriteCommunityEntries(
      file(placeholder, community),
      [],
    )

    expect(communityItems(after)).toEqual([])
    expect(after).toContain(placeholder)
  })

  it('adds entries to a catalog that has none of them yet', async () => {
    const after = await rewriteCommunityEntries(file(placeholder), [entry()])

    expect(communityItems(after)).toHaveLength(1)
  })

  it('writes the same file again when nothing has changed', async () => {
    const before = await rewriteCommunityEntries(file(placeholder), [entry()])
    const again = await rewriteCommunityEntries(before, [entry()])

    expect(again).toBe(before)
  })
})
