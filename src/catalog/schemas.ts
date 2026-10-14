/**
 * Runtime guards for the model in `types.ts`, used on every catalog load.
 *
 * Objects are strict: an unrecognized key is an error rather than a silently
 * ignored field, so a misspelled `recolourable` in the designer's JSON fails
 * loudly instead of quietly turning a pattern un-recolorable.
 */
import { z } from 'zod'
import type {
  AssetSource,
  Design,
  Layer,
  LeafDye,
  Localized,
  Pattern,
  PrintArea,
  Product,
} from './types'

/** Bumped only when a catalog file's shape changes incompatibly. */
export const CATALOG_VERSION = 1

/** Stable, URL-safe ids: lowercase kebab-case, as in `shawl-cotton`. */
export const idSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'must be lowercase kebab-case, e.g. "golden-teak"',
  )

export const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    'must be a hex colour, e.g. "#4B2A4F"',
  )

/** Asset files are served from public/catalog, so paths are absolute and typed. */
export const catalogAssetPathSchema = z
  .string()
  .regex(
    /^\/catalog\/[\w\-./]+\.(?:svg|png|jpg|jpeg|webp)$/,
    'must be a path under /catalog/ ending in .svg, .png, .jpg, .jpeg or .webp',
  )

export const localizedSchema = z.strictObject({
  th: z.string().min(1),
  en: z.string().min(1),
})

export const assetSourceSchema = z.strictObject({
  type: z.enum(['placeholder', 'community']),
  credit: z.string().min(1),
  license: z.string().min(1),
  url: z.url().optional(),
})

export const leafDyeColorSchema = z.strictObject({
  id: idSchema,
  name: localizedSchema,
  hex: hexColorSchema,
})

export const leafDyeSchema = z.strictObject({
  id: idSchema,
  name: localizedSchema,
  colors: z.array(leafDyeColorSchema).min(1),
  source: assetSourceSchema.optional(),
})

export const patternKindSchema = z.enum(['tile', 'motif'])

export const patternSchema = z
  .strictObject({
    id: idSchema,
    name: localizedSchema,
    kind: patternKindSchema,
    src: catalogAssetPathSchema,
    thumbnail: catalogAssetPathSchema.optional(),
    recolorable: z.boolean(),
    defaultColors: z.array(hexColorSchema),
    leafIds: z.array(idSchema).optional(),
    tags: z.array(z.string().min(1)),
    source: assetSourceSchema,
  })
  .refine((p) => !p.recolorable || p.defaultColors.length > 0, {
    message: 'a recolorable pattern needs at least one entry in defaultColors',
    path: ['defaultColors'],
  })

export const printAreaClipSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('rect'),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  z.strictObject({ type: z.literal('path'), d: z.string().min(1) }),
])

export const printAreaSchema = z.strictObject({
  id: idSchema,
  name: localizedSchema,
  clip: printAreaClipSchema,
  allowedKinds: z.array(patternKindSchema).min(1),
})

export const priceSchema = z
  .strictObject({
    min: z.number().nonnegative(),
    max: z.number().nonnegative().optional(),
    currency: z.literal('THB'),
  })
  .refine((p) => p.max === undefined || p.max >= p.min, {
    message: 'max must be greater than or equal to min',
    path: ['max'],
  })

export const productSchema = z.strictObject({
  id: idSchema,
  name: localizedSchema,
  line: z.enum(['fabric', 'leaf', 'gift', 'drinkware']),
  price: priceSchema.nullable(),
  status: z.enum(['available', 'planned']),
  mockup: z.strictObject({
    base: catalogAssetPathSchema,
    overlay: catalogAssetPathSchema.optional(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  printAreas: z.array(printAreaSchema).min(1),
  baseColors: z.array(hexColorSchema).min(1),
  story: localizedSchema.optional(),
  source: assetSourceSchema.optional(),
})

const layerBase = {
  id: idSchema,
  patternId: idSchema,
  printAreaId: idSchema,
  scale: z.number().positive(),
  rotation: z.number(),
  colors: z.array(hexColorSchema),
  opacity: z.number().min(0).max(1),
}

export const layerSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...layerBase,
    type: z.literal('tile'),
    offsetX: z.number(),
    offsetY: z.number(),
  }),
  z.strictObject({
    ...layerBase,
    type: z.literal('motif'),
    x: z.number(),
    y: z.number(),
  }),
])

export const designSchema = z.strictObject({
  version: z.literal(1),
  productId: idSchema,
  baseColor: hexColorSchema,
  layers: z.array(layerSchema),
  note: z.string().optional(),
})

/** Every catalog file is `{ "catalogVersion": 1, "items": [...] }`. */
export const catalogFileSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.strictObject({
    catalogVersion: z.literal(CATALOG_VERSION),
    items: z.array(itemSchema),
  })

export const leafDyesFileSchema = catalogFileSchema(leafDyeSchema)
export const patternsFileSchema = catalogFileSchema(patternSchema)
export const productsFileSchema = catalogFileSchema(productSchema)

export type CatalogFile<T> = {
  catalogVersion: typeof CATALOG_VERSION
  items: T[]
}

/**
 * Compile-time guard: `tsc` fails here if a schema and its hand-written type in
 * `types.ts` stop describing the same shape.
 */
type Matches<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

export type SchemaTypeChecks = {
  localized: Expect<Matches<z.infer<typeof localizedSchema>, Localized>>
  assetSource: Expect<Matches<z.infer<typeof assetSourceSchema>, AssetSource>>
  leafDye: Expect<Matches<z.infer<typeof leafDyeSchema>, LeafDye>>
  pattern: Expect<Matches<z.infer<typeof patternSchema>, Pattern>>
  printArea: Expect<Matches<z.infer<typeof printAreaSchema>, PrintArea>>
  product: Expect<Matches<z.infer<typeof productSchema>, Product>>
  layer: Expect<Matches<z.infer<typeof layerSchema>, Layer>>
  design: Expect<Matches<z.infer<typeof designSchema>, Design>>
}
