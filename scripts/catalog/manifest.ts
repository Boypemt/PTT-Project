/**
 * The source manifest: the designer's list of what their folder holds.
 *
 * It lives next to the original artwork — `../Design Pattern/
 * patterns.manifest.json` — and never enters the repository, because the
 * folder it describes does not either. An annotated copy is kept at
 * `docs/patterns.manifest.example.json` for whoever is starting one.
 *
 * It exists because a file name cannot carry a Thai name, a repeat size or the
 * fact that a drawing is placed once rather than tiled. Those are decisions,
 * they have to survive a file being re-exported, and `Untitled_Artwork 6.png`
 * is what a drawing app actually produces. So the manifest holds the
 * decisions, the file name is just a pointer, and **the id is the identity**:
 * re-export the artwork under any name, keep the id, and the pattern people
 * have already designed with stays the same pattern.
 *
 * The schema here is a copy of the parts of `src/catalog/schemas.ts` a
 * manifest entry shares with a catalog entry, rather than an import of it: the
 * app is compiled for a bundler and these scripts for Node, and the two module
 * resolutions do not mix. What keeps the two honest is that the catalog this
 * writes is validated by the app's own schemas in `seedCatalog.test.ts`, so a
 * drift between them fails the unit suite rather than the website.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

/** What the file is called, wherever the artwork lives. */
export const MANIFEST_NAME = 'patterns.manifest.json'

/** Bumped only if a manifest's shape changes incompatibly. */
export const MANIFEST_VERSION = 1

/** Until the community settles how its patterns should be licensed. */
export const DEFAULT_LICENSE = 'Community-owned — terms TBC'

/** On every entry, so the library can tell the real patterns from stand-ins. */
export const COMMUNITY_TAG = 'community'

const idSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'must be lowercase kebab-case, e.g. "pastel-stripes"',
  )

const localizedSchema = z.strictObject({
  th: z.string().min(1),
  en: z.string().min(1),
})

const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    'must be a hex colour, e.g. "#4B2A4F"',
  )

const levelSchema = z.number().int().min(0).max(255)

/**
 * The luminance the ink ends at and the paper begins at, for a drawing the
 * import reads wrong. Omitted — which is the ordinary case — it reads them
 * from the drawing itself (`mask.ts`).
 */
const maskLevelsSchema = z
  .strictObject({ black: levelSchema, white: levelSchema })
  .refine((levels) => levels.black < levels.white, {
    message: 'black must be darker than white',
    path: ['white'],
  })

const restrictToSchema = z
  .strictObject({
    lines: z
      .array(z.enum(['fabric', 'leaf', 'gift', 'drinkware']))
      .min(1)
      .optional(),
    productIds: z.array(idSchema).min(1).optional(),
  })
  .refine((r) => r.lines !== undefined || r.productIds !== undefined, {
    message: 'name at least one of lines or productIds, or omit restrictTo',
  })

export const manifestEntrySchema = z
  .strictObject({
    /** The artwork, relative to the manifest's own folder. */
    file: z.string().min(1),
    /** The pattern's identity. Keep it when the artwork is revised. */
    id: idSchema,
    name: localizedSchema,
    /**
     * `mask` = line art on a white page, imported as ink in an alpha channel
     * so a leaf dye can be poured into it. Omitted, the artwork keeps the
     * colours it was drawn in and the dye picker stays hidden.
     */
    recolor: z.enum(['mask']).optional(),
    /** The dye it is listed in. Exactly one, for a mask's one ink. */
    defaultColors: z.array(hexColorSchema).default([]),
    /** Levels for a mask the import reads wrong. Omitted, it reads them. */
    maskLevels: maskLevelsSchema.optional(),
    /** `area` = laid into the print area once. Omitted is a repeating tile. */
    fit: z.enum(['repeat', 'area']).optional(),
    /** Mockup units one repeat covers across the tile's width. */
    repeatUnits: z.number().positive().optional(),
    restrictTo: restrictToSchema.optional(),
    /** Extra tags; `community` is added for you. */
    tags: z.array(z.string().min(1)).default([]),
    credit: z.string().min(1),
    license: z.string().min(1).default(DEFAULT_LICENSE),
  })
  .refine((entry) => entry.repeatUnits === undefined || entry.fit !== 'area', {
    message:
      'a pattern placed once is sized by the print area, so it has no repeatUnits',
    path: ['repeatUnits'],
  })
  // One mask, one ink, one colour — and one slot in the leaf-dye picker.
  .refine(
    (entry) => entry.recolor !== 'mask' || entry.defaultColors.length === 1,
    {
      message:
        'an ink mask is painted in one colour, so defaultColors holds exactly one',
      path: ['defaultColors'],
    },
  )
  // A pattern that keeps its own colours has no colour to be listed in: the
  // dye would be offered and then do nothing.
  .refine(
    (entry) => entry.defaultColors.length === 0 || entry.recolor === 'mask',
    {
      message:
        'only a pattern with recolor: "mask" takes defaultColors — its colours are in the file otherwise',
      path: ['defaultColors'],
    },
  )
  .refine(
    (entry) => entry.maskLevels === undefined || entry.recolor === 'mask',
    {
      message:
        'maskLevels is how an ink mask is read, so it needs recolor: "mask"',
      path: ['maskLevels'],
    },
  )

export type ManifestEntry = z.infer<typeof manifestEntrySchema>

export const manifestSchema = z.strictObject({
  manifestVersion: z.literal(MANIFEST_VERSION),
  patterns: z.array(manifestEntrySchema).min(1),
})

export type Manifest = z.infer<typeof manifestSchema>

/**
 * The one error this throws, shaped like `CatalogError` in the app: the file
 * first, then one line per problem naming the entry it is in. Whoever reads it
 * is editing JSON by hand, and "patterns[3].name.th" alone does not say which
 * pattern that is.
 */
export class ManifestError extends Error {
  readonly problems: string[]

  constructor(file: string, problems: string[], options?: ErrorOptions) {
    const count =
      problems.length === 1
        ? '1 problem'
        : `${String(problems.length)} problems`

    super(
      [`${file}: ${count}`, ...problems.map((p) => `  - ${p}`)].join('\n'),
      options,
    )
    this.name = 'ManifestError'
    this.problems = problems
  }
}

/**
 * The id of a half-parsed entry, for naming it in an error. Anything whose id
 * is missing or is not a string is a `?`: the entry is being reported because
 * it is malformed, and the message must not fail on the way out.
 */
export function idOf(value: unknown): string {
  return typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
    ? value.id
    : '?'
}

/** "entry "lemons" (index 2) repeatUnits: must be greater than 0". */
function describe(issue: z.core.$ZodIssue, patterns: unknown): string {
  const [head, index, ...rest] = issue.path
  const inPatterns = head === 'patterns' && typeof index === 'number'

  if (!inPatterns)
    return `${issue.path.join('.') || '(root)'}: ${issue.message}`

  const entry: unknown = Array.isArray(patterns) ? patterns[index] : undefined
  const where = rest.length > 0 ? ` ${rest.join('.')}` : ''
  const id = idOf(entry)

  return `entry "${id}" (index ${String(index)})${where}: ${issue.message}`
}

/** Two entries claiming one id — or one file — is a mistake, not a merge. */
function duplicates(entries: ManifestEntry[]): string[] {
  const seen = {
    id: new Map<string, number>(),
    file: new Map<string, number>(),
  }
  const problems: string[] = []

  entries.forEach((entry, index) => {
    for (const field of ['id', 'file'] as const) {
      const first = seen[field].get(entry[field])

      if (first === undefined) {
        seen[field].set(entry[field], index)
      } else {
        problems.push(
          `entry "${entry.id}" (index ${String(index)}) ${field}: ` +
            `"${entry[field]}" is already used by the entry at index ${String(first)}`,
        )
      }
    }
  })

  return problems
}

/**
 * JSON has no comments, and this is a file somebody keeps by hand for months
 * — so a key beginning with `_` is a note to the next person and is dropped
 * before validation. Everything else is checked strictly, because a key the
 * schema does not know is a typo, and a silently ignored `repeatunits` is a
 * pattern that comes out the wrong size with nothing to say why.
 */
export function stripComments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripComments)

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, inner]) => [key, stripComments(inner)]),
    )
  }

  return value
}

/** Validates an already-parsed manifest. Exported for the tests. */
export function parseManifest(source: unknown, file = MANIFEST_NAME): Manifest {
  const value = stripComments(source)
  const result = manifestSchema.safeParse(value)

  if (!result.success) {
    const patterns: unknown =
      typeof value === 'object' && value !== null && 'patterns' in value
        ? value.patterns
        : undefined

    throw new ManifestError(
      file,
      result.error.issues.map((issue) => describe(issue, patterns)),
    )
  }

  const clashes = duplicates(result.data.patterns)
  if (clashes.length > 0) throw new ManifestError(file, clashes)

  return result.data
}

/** Reads and validates `<dir>/patterns.manifest.json`. */
export async function loadManifest(dir: string): Promise<Manifest> {
  const file = path.join(dir, MANIFEST_NAME)
  let text: string

  try {
    text = await readFile(file, 'utf8')
  } catch {
    throw new ManifestError(file, [
      'no manifest here. Copy docs/patterns.manifest.example.json next to the' +
        ' artwork and list the files in it.',
    ])
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new ManifestError(
      file,
      [
        `not valid JSON: ${error instanceof Error ? error.message : 'unparsable'}`,
      ],
      { cause: error },
    )
  }

  return parseManifest(parsed, file)
}
