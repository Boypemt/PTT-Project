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
  PatternRestriction,
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

export const productLineSchema = z.enum(['fabric', 'leaf', 'gift', 'drinkware'])

export const patternFitSchema = z.enum(['repeat', 'area'])

export const patternRecolorSchema = z.enum(['svg', 'mask'])

/** Which of the two tinting routes a file can take is decided by its type. */
const isSvgPath = (src: string) => src.toLowerCase().endsWith('.svg')

export const patternRestrictionSchema = z
  .strictObject({
    lines: z.array(productLineSchema).min(1).optional(),
    productIds: z.array(idSchema).min(1).optional(),
  })
  // An empty restriction would read as "nowhere" and mean "everywhere"; the
  // way to say everywhere is to leave the field out.
  .refine((r) => r.lines !== undefined || r.productIds !== undefined, {
    message: 'name at least one of lines or productIds, or omit restrictTo',
  })

export const patternSchema = z
  .strictObject({
    id: idSchema,
    name: localizedSchema,
    kind: patternKindSchema,
    src: catalogAssetPathSchema,
    thumbnail: catalogAssetPathSchema.optional(),
    recolorable: z.boolean(),
    recolor: patternRecolorSchema.optional(),
    repeatUnits: z.number().positive().optional(),
    fit: patternFitSchema.optional(),
    restrictTo: patternRestrictionSchema.optional(),
    defaultColors: z.array(hexColorSchema),
    leafIds: z.array(idSchema).optional(),
    tags: z.array(z.string().min(1)),
    source: assetSourceSchema,
  })
  .refine((p) => !p.recolorable || p.defaultColors.length > 0, {
    message: 'a recolorable pattern needs at least one entry in defaultColors',
    path: ['defaultColors'],
  })
  // `recolor` says *how* a pattern is tinted, so it means nothing on one that
  // is not. Two fields that could disagree are kept from disagreeing here.
  .refine((p) => p.recolor === undefined || p.recolorable, {
    message:
      'recolor says how a pattern is tinted, so it needs recolorable: true',
    path: ['recolor'],
  })
  .refine((p) => p.recolor !== 'svg' || isSvgPath(p.src), {
    message: 'only an SVG can have its own fills rewritten',
    path: ['recolor'],
  })
  // A bitmap has no fills to rewrite, so a recolorable one is an ink mask and
  // has to say so: nothing about a .webp tells the two apart.
  .refine((p) => !p.recolorable || isSvgPath(p.src) || p.recolor === 'mask', {
    message:
      'a recolorable bitmap is tinted as an ink mask: say recolor: "mask"',
    path: ['recolor'],
  })
  // One mask, one ink, one colour — and one slot in the leaf-dye picker.
  .refine((p) => p.recolor !== 'mask' || p.defaultColors.length === 1, {
    message:
      'an ink mask is painted in one colour, so defaultColors holds exactly one',
    path: ['defaultColors'],
  })
  // A motif is placed by hand and sized against MOTIF_UNIT, so neither of the
  // tile fields means anything on one.
  .refine((p) => p.kind === 'tile' || p.fit === undefined, {
    message: 'only a tile has a fit; a motif is placed one at a time',
    path: ['fit'],
  })
  .refine(
    (p) =>
      p.repeatUnits === undefined || (p.kind === 'tile' && p.fit !== 'area'),
    {
      message:
        'only a repeating tile has a repeat size: a placement pattern is sized by the print area, and a motif by MOTIF_UNIT',
      path: ['repeatUnits'],
    },
  )

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
  line: productLineSchema,
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
  // Optional in the file, always an array once parsed, so a product the
  // designer adds without tags still reads as "no tags" everywhere.
  tags: z.array(z.string().min(1)).default([]),
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
  patternRestriction: Expect<
    Matches<z.infer<typeof patternRestrictionSchema>, PatternRestriction>
  >
  printArea: Expect<Matches<z.infer<typeof printAreaSchema>, PrintArea>>
  product: Expect<Matches<z.infer<typeof productSchema>, Product>>
  layer: Expect<Matches<z.infer<typeof layerSchema>, Layer>>
  design: Expect<Matches<z.infer<typeof designSchema>, Design>>
}
