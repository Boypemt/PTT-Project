/**
 * The manifest is edited by hand, by someone who is not reading this code, so
 * what is tested here is mostly the *message*: a problem has to name the entry
 * it is in, not a path like `patterns.3.name.th`.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LICENSE,
  ManifestError,
  parseManifest,
  type Manifest,
} from './manifest.ts'

const entry = (overrides: Record<string, unknown> = {}) => ({
  file: 'lemons.png',
  id: 'lemons',
  name: { th: 'ลายมะนาว', en: 'Lemons' },
  repeatUnits: 500,
  credit: 'Designer TBC',
  ...overrides,
})

const manifest = (...patterns: unknown[]) => ({
  manifestVersion: 1,
  patterns: patterns.length > 0 ? patterns : [entry()],
})

/** The problems of a manifest that should not pass. */
function problemsOf(value: unknown): string[] {
  try {
    parseManifest(value)
  } catch (error) {
    if (error instanceof ManifestError) return error.problems
    throw error
  }

  throw new Error('the manifest was accepted')
}

describe('parseManifest', () => {
  it('accepts a minimal entry and fills in what it can', () => {
    const parsed: Manifest = parseManifest(manifest())

    expect(parsed.patterns[0]).toMatchObject({
      id: 'lemons',
      tags: [],
      license: DEFAULT_LICENSE,
    })
  })

  it('keeps a licence the manifest states for itself', () => {
    const parsed = parseManifest(manifest(entry({ license: 'CC0-1.0' })))

    expect(parsed.patterns[0]?.license).toBe('CC0-1.0')
  })

  it('names the entry a problem is in, not its index alone', () => {
    const problems = problemsOf(
      manifest(entry(), entry({ id: 'stars', name: { en: 'Stars' } })),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('entry "stars" (index 1)')
    expect(problems[0]).toContain('name.th')
  })

  it('says "?" for an entry whose id is the thing that is wrong', () => {
    const problems = problemsOf(manifest(entry({ id: 'Lemons!' })))

    expect(problems[0]).toContain('kebab-case')
  })

  it('rejects an unknown key rather than ignoring a typo', () => {
    const problems = problemsOf(manifest(entry({ repeatunits: 500 })))

    expect(problems[0]).toContain('entry "lemons"')
  })

  it('ignores a key beginning with _, which is how a manifest is annotated', () => {
    const parsed = parseManifest({
      _README: 'JSON has no comments, so this is one.',
      manifestVersion: 1,
      patterns: [entry({ _comment: ['a note', 'over two lines'] })],
    })

    expect(parsed.patterns[0]?.id).toBe('lemons')
  })

  it('accepts the example that ships with the docs', async () => {
    // The example is what a designer copies, so it has to be a manifest that
    // would actually pass — comments, every optional field and all.
    const example: unknown = JSON.parse(
      await readFile('docs/patterns.manifest.example.json', 'utf8'),
    )

    expect(parseManifest(example).patterns).toHaveLength(3)
  })

  it('rejects a repeat size on a pattern that is placed once', () => {
    const problems = problemsOf(
      manifest(entry({ fit: 'area', repeatUnits: 500 })),
    )

    expect(problems[0]).toContain('sized by the print area')
  })

  it('rejects two entries claiming the same id', () => {
    const problems = problemsOf(
      manifest(entry(), entry({ file: 'lemons-v2.png' })),
    )

    expect(problems[0]).toContain('"lemons" is already used')
  })

  it('rejects two entries claiming the same file', () => {
    const problems = problemsOf(manifest(entry(), entry({ id: 'lemons-two' })))

    expect(
      problems.some((p) => p.includes('"lemons.png" is already used')),
    ).toBe(true)
  })

  it('rejects a manifest from a future version', () => {
    expect(problemsOf({ manifestVersion: 2, patterns: [entry()] })).not.toEqual(
      [],
    )
  })

  it('writes the file name and the count at the top of the message', () => {
    try {
      parseManifest(manifest(entry({ credit: '' })), 'patterns.manifest.json')
    } catch (error) {
      expect((error as Error).message).toContain(
        'patterns.manifest.json: 1 problem',
      )
    }
  })
})
