/**
 * Guards the real files in public/catalog: they must pass the same validation
 * the browser runs, so a bad edit fails here rather than in front of a visitor.
 */
import { existsSync, readFileSync } from 'node:fs'
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

/**
 * Every string in the catalog that names an asset. Walking the whole tree
 * rather than listing fields keeps the check honest when the model grows a
 * second overlay or a thumbnail.
 */
function collectAssetPaths(value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') {
    if (value.startsWith('/catalog/')) found.push(value)
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectAssetPaths(entry, found))
  } else if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((entry) => collectAssetPaths(entry, found))
  }

  return found
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

  it('carries all eleven products from the brief', () => {
    const { products } = loadSeedCatalog()

    expect(products.map((product) => product.id)).toEqual([
      'shawl-cotton',
      'shawl-silk',
      'handkerchief',
      'shirt-women',
      'shirt-men',
      'wrap-cloth',
      'leaf-plate',
      'fan',
      'keychain',
      'mug',
      'tumbler',
    ])
    expect(
      products
        .filter((product) => product.status === 'planned')
        .map((product) => product.price),
    ).toEqual([null, null])
  })

  it('tags the two best sellers from the field report', () => {
    const { products } = loadSeedCatalog()

    expect(
      products
        .filter((product) => product.tags.includes('bestseller'))
        .map((product) => product.id),
    ).toEqual(['shawl-cotton', 'handkerchief'])
  })

  it('references only asset files that exist under public/', () => {
    const paths = [...new Set(collectAssetPaths(loadSeedCatalog()))].sort()

    expect(paths.length).toBeGreaterThan(0)
    expect(paths.filter((path) => !existsSync(`public${path}`))).toEqual([])
  })

  it('marks every pattern as a placeholder until the designer delivers', () => {
    const { patterns } = loadSeedCatalog()

    expect(patterns.length).toBeGreaterThan(0)
    expect(
      patterns.every((pattern) => pattern.source.type === 'placeholder'),
    ).toBe(true)
  })

  it('marks the approximate leaf-dye hexes and drawn mockups as placeholders', () => {
    const { leafDyes, products } = loadSeedCatalog()

    expect(
      leafDyes.every((leafDye) => leafDye.source?.type === 'placeholder'),
    ).toBe(true)
    expect(leafDyes[0]?.source?.credit).toContain('colour-matched')
    expect(
      products.every((product) => product.source?.type === 'placeholder'),
    ).toBe(true)
  })
})
