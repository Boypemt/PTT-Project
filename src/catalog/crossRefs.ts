/**
 * Checks the three catalog files make sense *together*, which no single-file
 * schema can see: ids are unique, and a pattern's `leafIds` point at leaf dyes
 * that actually exist.
 *
 * Colours are plain hex in this model (see docs/PROJECT_BRIEF.md), so colour
 * validity is settled by `hexColorSchema` at parse time; what's left to check
 * here is that colour *ids* don't collide inside a leaf dye.
 */
import { CatalogError } from './errors'
import { CATALOG_FILES } from './files'
import type { Catalog } from './types'

type Problem = { file: string; message: string }

/** `item "teak" (index 3)` — same wording the loaders use. */
function label(id: string, index: number): string {
  return `item "${id}" (index ${index})`
}

function duplicateIds(
  file: string,
  items: readonly { id: string }[],
): Problem[] {
  const seen = new Map<string, number>()
  const problems: Problem[] = []

  items.forEach((item, index) => {
    const first = seen.get(item.id)
    if (first === undefined) {
      seen.set(item.id, index)
    } else {
      problems.push({
        file,
        message: `${label(item.id, index)} id: duplicate id, already used at index ${first}`,
      })
    }
  })

  return problems
}

function duplicateNestedIds(
  file: string,
  owner: { id: string },
  ownerIndex: number,
  field: string,
  nested: readonly { id: string }[],
): Problem[] {
  const seen = new Set<string>()
  const problems: Problem[] = []

  nested.forEach((entry, index) => {
    if (seen.has(entry.id)) {
      problems.push({
        file,
        message: `${label(owner.id, ownerIndex)} ${field}[${index}].id: duplicate "${entry.id}" within the same ${field === 'colors' ? 'leaf dye' : 'product'}`,
      })
    }
    seen.add(entry.id)
  })

  return problems
}

/** Throws a single CatalogError listing every cross-reference problem found. */
export function validateCatalogRefs(catalog: Catalog): void {
  const { leafDyes, patterns, products } = catalog
  const problems: Problem[] = [
    ...duplicateIds(CATALOG_FILES.leafDyes, leafDyes),
    ...duplicateIds(CATALOG_FILES.patterns, patterns),
    ...duplicateIds(CATALOG_FILES.products, products),
  ]

  leafDyes.forEach((leafDye, index) => {
    problems.push(
      ...duplicateNestedIds(
        CATALOG_FILES.leafDyes,
        leafDye,
        index,
        'colors',
        leafDye.colors,
      ),
    )
  })

  products.forEach((product, index) => {
    problems.push(
      ...duplicateNestedIds(
        CATALOG_FILES.products,
        product,
        index,
        'printAreas',
        product.printAreas,
      ),
    )
  })

  const knownLeafIds = new Set(leafDyes.map((leafDye) => leafDye.id))
  const knownList = [...knownLeafIds].sort().join(', ')

  patterns.forEach((pattern, index) => {
    pattern.leafIds?.forEach((leafId, leafIndex) => {
      if (!knownLeafIds.has(leafId)) {
        problems.push({
          file: CATALOG_FILES.patterns,
          message: `${label(pattern.id, index)} leafIds[${leafIndex}]: unknown leaf dye "${leafId}" (known: ${knownList || 'none'})`,
        })
      }
    })
  })

  if (problems.length === 0) return

  // One file's worth of problems reads better without repeating the file name.
  const files = [...new Set(problems.map((problem) => problem.file))]
  const singleFile = files.length === 1 ? files[0] : undefined

  throw new CatalogError(
    singleFile ?? 'catalog',
    problems.map((problem) =>
      singleFile ? problem.message : `${problem.file} ${problem.message}`,
    ),
  )
}
