/**
 * Fetches the three catalog files, validates them and hands back typed data.
 * Nothing else in the app reads /catalog/*.json directly.
 */
import type { z } from 'zod'
import { CatalogError } from './errors'
import {
  leafDyeSchema,
  patternSchema,
  productSchema,
  CATALOG_VERSION,
} from './schemas'
import type { Catalog, LeafDye, Pattern, Product } from './types'

export const CATALOG_FILES = {
  leafDyes: 'leaf-dyes.json',
  patterns: 'patterns.json',
  products: 'products.json',
} as const

export type CatalogLoadOptions = {
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
  /** Where the catalog is served from. Defaults to `<base>/catalog/`. */
  baseUrl?: string
  signal?: AbortSignal
}

/** `colors[0].hex` — how a zod path reads to someone editing JSON. */
function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path
    .map((key, index) =>
      typeof key === 'number'
        ? `[${key}]`
        : index === 0
          ? String(key)
          : `.${String(key)}`,
    )
    .join('')
}

function formatIssues(issues: readonly z.core.$ZodIssue[], label: string) {
  return issues.map((issue) => {
    const path = formatPath(issue.path)
    return `${label}${path ? ` ${path}` : ''}: ${issue.message}`
  })
}

/** `item "teak" (index 3)`, or just the index when the id is unusable. */
function itemLabel(item: unknown, index: number): string {
  const id =
    typeof item === 'object' && item !== null && 'id' in item
      ? item.id
      : undefined

  return typeof id === 'string' && id.length > 0
    ? `item "${id}" (index ${index})`
    : `item at index ${index}`
}

async function fetchCatalogFile(
  file: string,
  options: CatalogLoadOptions,
): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const baseUrl = options.baseUrl ?? `${import.meta.env.BASE_URL}catalog/`
  const url = `${baseUrl}${file}`

  let response: Response
  try {
    response = await fetchImpl(url, { signal: options.signal })
  } catch (cause) {
    throw new CatalogError(
      file,
      [`could not be fetched from ${url}: ${String(cause)}`],
      { cause },
    )
  }

  if (!response.ok) {
    throw new CatalogError(file, [
      `could not be fetched from ${url}: HTTP ${response.status}`,
    ])
  }

  try {
    return (await response.json()) as unknown
  } catch (cause) {
    throw new CatalogError(file, [`is not valid JSON: ${String(cause)}`], {
      cause,
    })
  }
}

/**
 * Validates one catalog file. Items are parsed one at a time so a failure can
 * be reported against the item's own id rather than an array index alone, and
 * so one bad entry doesn't hide the others.
 */
export function parseCatalogFile<T>(
  file: string,
  itemSchema: z.ZodType<T>,
  raw: unknown,
): T[] {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    Array.isArray(raw) ||
    !('items' in raw) ||
    !Array.isArray(raw.items)
  ) {
    throw new CatalogError(file, [
      `must be an object shaped { "catalogVersion": ${CATALOG_VERSION}, "items": [...] }`,
    ])
  }

  const root = raw as { catalogVersion?: unknown; items: unknown[] }
  if (root.catalogVersion !== CATALOG_VERSION) {
    throw new CatalogError(file, [
      `catalogVersion: expected ${CATALOG_VERSION}, received ${JSON.stringify(root.catalogVersion)}`,
    ])
  }

  const items: T[] = []
  const problems: string[] = []

  root.items.forEach((item, index) => {
    const result = itemSchema.safeParse(item)
    if (result.success) {
      items.push(result.data)
    } else {
      problems.push(
        ...formatIssues(result.error.issues, itemLabel(item, index)),
      )
    }
  })

  if (problems.length > 0) throw new CatalogError(file, problems)
  return items
}

async function loadCatalogFile<T>(
  file: string,
  itemSchema: z.ZodType<T>,
  options: CatalogLoadOptions,
): Promise<T[]> {
  return parseCatalogFile(
    file,
    itemSchema,
    await fetchCatalogFile(file, options),
  )
}

export function loadLeafDyes(
  options: CatalogLoadOptions = {},
): Promise<LeafDye[]> {
  return loadCatalogFile(CATALOG_FILES.leafDyes, leafDyeSchema, options)
}

export function loadPatterns(
  options: CatalogLoadOptions = {},
): Promise<Pattern[]> {
  return loadCatalogFile(CATALOG_FILES.patterns, patternSchema, options)
}

export function loadProducts(
  options: CatalogLoadOptions = {},
): Promise<Product[]> {
  return loadCatalogFile(CATALOG_FILES.products, productSchema, options)
}

/** Loads all three files in parallel and returns the validated catalog. */
export async function loadCatalog(
  options: CatalogLoadOptions = {},
): Promise<Catalog> {
  const [leafDyes, patterns, products] = await Promise.all([
    loadLeafDyes(options),
    loadPatterns(options),
    loadProducts(options),
  ])

  return { leafDyes, patterns, products }
}
