/**
 * Guards the real files in public/catalog: they must pass the same validation
 * the browser runs, so a bad edit fails here rather than in front of a visitor.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateCatalogRefs } from './crossRefs'
import { CATALOG_FILES } from './files'
import { parseCatalogFile } from './loaders'
import { leafDyeSchema, patternSchema, productSchema } from './schemas'
import type { Catalog } from './types'

const readCatalogFile = (file: string): unknown =>
  JSON.parse(readFileSync(`public/catalog/${file}`, 'utf8'))

function loadSeedCatalog(): Catalog {
  return {
    leafDyes: parseCatalogFile(
      CATALOG_FILES.leafDyes,
      leafDyeSchema,
      readCatalogFile(CATALOG_FILES.leafDyes),
    ),
    patterns: parseCatalogFile(
      CATALOG_FILES.patterns,
      patternSchema,
      readCatalogFile(CATALOG_FILES.patterns),
    ),
    products: parseCatalogFile(
      CATALOG_FILES.products,
      productSchema,
      readCatalogFile(CATALOG_FILES.products),
    ),
  }
}

describe('the seeded catalog in public/catalog', () => {
  it('validates, including across files', () => {
    expect(() => validateCatalogRefs(loadSeedCatalog())).not.toThrow()
  })

  it('carries all six leaf dyes from the brief', () => {
    const { leafDyes } = loadSeedCatalog()

    expect(leafDyes.map((leafDye) => leafDye.id)).toEqual([
      'mango',
      'golden-teak',
      'marigold',
      'teak',
      'pheka',
      'takhop',
    ])
    expect(leafDyes.flatMap((leafDye) => leafDye.colors)).toHaveLength(11)
  })

  it('marks every pattern as a placeholder until the designer delivers', () => {
    const { patterns } = loadSeedCatalog()

    expect(patterns.length).toBeGreaterThan(0)
    expect(
      patterns.every((pattern) => pattern.source.type === 'placeholder'),
    ).toBe(true)
  })
})
