import { describe, expect, it } from 'vitest'
import {
  catalogFile,
  fetchFromFiles,
  makeLeafDye,
  makePattern,
  makeProduct,
} from '@/test/catalogFixtures'
import { CatalogError } from './errors'
import { loadCatalog, parseCatalogFile } from './loaders'
import { leafDyeSchema } from './schemas'

const parseLeafDyes = (raw: unknown) =>
  parseCatalogFile('leaf-dyes.json', leafDyeSchema, raw)

describe('parseCatalogFile', () => {
  it('returns the typed items of a valid file', () => {
    const items = parseLeafDyes(catalogFile([makeLeafDye()]))

    expect(items).toHaveLength(1)
    expect(items[0]?.colors[0]?.hex).toBe('#4B2A4F')
  })

  it('names the file, the item, its index and the path inside it', () => {
    const broken = makeLeafDye({
      colors: [
        {
          id: 'deep-purple',
          name: { th: 'ม่วง', en: 'Purple' },
          hex: 'purple',
        },
      ],
    })

    expect(() =>
      parseLeafDyes(catalogFile([makeLeafDye({ id: 'mango' }), broken])),
    ).toThrowError(/leaf-dyes\.json/)

    try {
      parseLeafDyes(catalogFile([makeLeafDye({ id: 'mango' }), broken]))
      expect.unreachable('expected a CatalogError')
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogError)
      const catalogError = error as CatalogError
      expect(catalogError.file).toBe('leaf-dyes.json')
      expect(catalogError.message).toContain('leaf-dyes.json')
      expect(catalogError.message).toContain('item "teak" (index 1)')
      expect(catalogError.message).toContain('colors[0].hex')
    }
  })

  it('reports every bad item rather than stopping at the first', () => {
    try {
      parseLeafDyes(
        catalogFile([
          makeLeafDye({ id: 'bad one' }),
          makeLeafDye({ id: 'mango', colors: [] }),
        ]),
      )
      expect.unreachable('expected a CatalogError')
    } catch (error) {
      const { problems } = error as CatalogError
      expect(problems).toHaveLength(2)
      expect(problems[0]).toContain('item "bad one" (index 0)')
      expect(problems[1]).toContain('item "mango" (index 1)')
    }
  })

  it('falls back to the index when an item has no usable id', () => {
    try {
      parseLeafDyes(catalogFile([{ name: { th: 'x', en: 'x' } }]))
      expect.unreachable('expected a CatalogError')
    } catch (error) {
      expect((error as CatalogError).message).toContain('item at index 0')
    }
  })

  it('rejects a root that is not { catalogVersion, items }', () => {
    expect(() => parseLeafDyes([makeLeafDye()])).toThrowError(/catalogVersion/)
  })

  it('rejects an unexpected catalogVersion', () => {
    expect(() => parseLeafDyes(catalogFile([], 2))).toThrowError(
      /catalogVersion: expected 1, received 2/,
    )
  })
})

describe('loadCatalog', () => {
  const validFiles = {
    'leaf-dyes.json': catalogFile([makeLeafDye()]),
    'patterns.json': catalogFile([makePattern()]),
    'products.json': catalogFile([makeProduct()]),
  }

  it('loads and validates all three files', async () => {
    const catalog = await loadCatalog({
      fetchImpl: fetchFromFiles(validFiles),
      baseUrl: '/catalog/',
    })

    expect(catalog.leafDyes).toHaveLength(1)
    expect(catalog.patterns[0]?.id).toBe('seigaiha')
    expect(catalog.products[0]?.price).toEqual({ min: 69, currency: 'THB' })
  })

  it('names the missing file when a request fails', async () => {
    const error = await loadCatalog({
      fetchImpl: fetchFromFiles({
        'leaf-dyes.json': validFiles['leaf-dyes.json'],
      }),
      baseUrl: '/catalog/',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(CatalogError)
    expect((error as CatalogError).message).toMatch(
      /patterns\.json|products\.json/,
    )
    expect((error as CatalogError).message).toContain('HTTP 404')
  })

  it('applies cross-reference checks across the loaded files', async () => {
    const error = await loadCatalog({
      fetchImpl: fetchFromFiles({
        ...validFiles,
        'patterns.json': catalogFile([makePattern({ leafIds: ['teek'] })]),
      }),
      baseUrl: '/catalog/',
    }).catch((caught: unknown) => caught)

    expect((error as CatalogError).message).toContain('unknown leaf dye "teek"')
  })
})
