/**
 * Builders for catalog test data. Each returns a valid entry that a test can
 * break in exactly one way, so a failure points at the rule under test.
 */
import type { Catalog, LeafDye, Pattern, Product } from '@/catalog'

export const localized = (en: string) => ({ th: `TH ${en}`, en })

export function makeLeafDye(overrides: Partial<LeafDye> = {}): LeafDye {
  return {
    id: 'teak',
    name: localized('Teak leaf'),
    colors: [
      { id: 'deep-purple', name: localized('Deep purple'), hex: '#4B2A4F' },
    ],
    ...overrides,
  }
}

export function makePattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: 'seigaiha',
    name: localized('Seigaiha waves'),
    kind: 'tile',
    src: '/catalog/patterns/seigaiha.svg',
    recolorable: true,
    defaultColors: ['#4B2A4F'],
    leafIds: ['teak'],
    tags: ['geometric'],
    source: {
      type: 'placeholder',
      credit: 'Drawn as SVG for this prototype',
      license: 'CC0-1.0',
    },
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'handkerchief',
    name: localized('Handkerchief'),
    line: 'fabric',
    price: { min: 69, currency: 'THB' },
    status: 'available',
    mockup: {
      base: '/catalog/products/handkerchief-base.svg',
      width: 800,
      height: 800,
    },
    printAreas: [
      {
        id: 'cloth',
        name: localized('Whole cloth'),
        clip: { type: 'rect', x: 60, y: 60, width: 680, height: 680 },
        allowedKinds: ['tile', 'motif'],
      },
    ],
    baseColors: ['#F3EADA'],
    tags: [],
    ...overrides,
  }
}

export function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    leafDyes: [makeLeafDye()],
    patterns: [makePattern()],
    products: [makeProduct()],
    ...overrides,
  }
}

/** Wraps items in the `{ catalogVersion, items }` root every file has. */
export const catalogFile = (items: unknown[], catalogVersion: unknown = 1) => ({
  catalogVersion,
  items,
})

/** The URL a `fetch` call was made with, whichever form the caller used. */
export function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') return input
  return input instanceof URL ? input.href : input.url
}

/** A `fetch` that serves the given bodies by file name and 404s anything else. */
export function fetchFromFiles(files: Record<string, unknown>): typeof fetch {
  return (input) => {
    const url = requestUrl(input)
    const match = Object.keys(files).find((file) => url.endsWith(file))

    return Promise.resolve(
      match === undefined
        ? new Response('not found', { status: 404 })
        : new Response(JSON.stringify(files[match]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
    )
  }
}
