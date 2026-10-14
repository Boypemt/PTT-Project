import { describe, expect, it } from 'vitest'
import {
  localized,
  makeCatalog,
  makeLeafDye,
  makePattern,
  makeProduct,
} from '@/test/catalogFixtures'
import { validateCatalogRefs } from './crossRefs'
import type { CatalogError } from './errors'

/** Runs the checks and returns the error, so each test can read its message. */
function problemsOf(catalog: Parameters<typeof validateCatalogRefs>[0]) {
  try {
    validateCatalogRefs(catalog)
    return null
  } catch (error) {
    return error as CatalogError
  }
}

describe('validateCatalogRefs', () => {
  it('passes a consistent catalog', () => {
    expect(problemsOf(makeCatalog())).toBeNull()
  })

  it('passes a pattern with no leafIds', () => {
    const catalog = makeCatalog({
      patterns: [makePattern({ leafIds: undefined })],
    })

    expect(problemsOf(catalog)).toBeNull()
  })

  it('fails a duplicate id, naming the file and the item', () => {
    const error = problemsOf(
      makeCatalog({ leafDyes: [makeLeafDye(), makeLeafDye()] }),
    )

    expect(error?.file).toBe('leaf-dyes.json')
    expect(error?.message).toContain('leaf-dyes.json')
    expect(error?.message).toContain('item "teak" (index 1) id: duplicate id')
    expect(error?.message).toContain('already used at index 0')
  })

  it('fails an unknown leafId and lists the ids that do exist', () => {
    const error = problemsOf(
      makeCatalog({ patterns: [makePattern({ leafIds: ['teek'] })] }),
    )

    expect(error?.file).toBe('patterns.json')
    expect(error?.message).toContain('item "seigaiha" (index 0) leafIds[0]')
    expect(error?.message).toContain('unknown leaf dye "teek"')
    expect(error?.message).toContain('known: teak')
  })

  it('fails a duplicate colour id inside one leaf dye', () => {
    const color = {
      id: 'deep-purple',
      name: localized('Deep purple'),
      hex: '#4B2A4F',
    }
    const error = problemsOf(
      makeCatalog({ leafDyes: [makeLeafDye({ colors: [color, color] })] }),
    )

    expect(error?.message).toContain('colors[1].id')
    expect(error?.message).toContain('duplicate "deep-purple"')
  })

  it('fails a duplicate print-area id inside one product', () => {
    const product = makeProduct()
    const error = problemsOf(
      makeCatalog({
        products: [
          makeProduct({
            printAreas: [product.printAreas[0], product.printAreas[0]],
          }),
        ],
      }),
    )

    expect(error?.message).toContain('printAreas[1].id')
    expect(error?.message).toContain('duplicate "cloth"')
  })

  it('prefixes each problem with its file when problems span files', () => {
    const error = problemsOf(
      makeCatalog({
        patterns: [makePattern(), makePattern()],
        products: [makeProduct(), makeProduct()],
      }),
    )

    expect(error?.file).toBe('catalog')
    expect(error?.problems).toHaveLength(2)
    expect(error?.problems[0]).toContain('patterns.json item "seigaiha"')
    expect(error?.problems[1]).toContain('products.json item "handkerchief"')
  })
})
