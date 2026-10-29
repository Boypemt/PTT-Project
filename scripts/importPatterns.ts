/**
 * Brings the designer's folder of artwork into the catalog, in one command.
 *
 *   npm run catalog:import -- "../Design Pattern"
 *
 * The folder holds the originals and a `patterns.manifest.json` listing them —
 * neither is in this repository, because the masters are the designer's and a
 * 20 MB print-resolution PNG is not something a visitor should download. The
 * manifest says what each file is: its id, its name in both languages, how big
 * its repeat is, whether it is placed once rather than tiled, who to credit.
 * See `scripts/catalog/manifest.ts` and `docs/ADDING_PATTERNS.md`.
 *
 * What this does with it:
 *
 * - converts each file to a WebP under 600 KB plus a 240 px thumbnail, named
 *   with a hash of the artwork, so a revision cannot be served from a cache
 *   and an unchanged one is not rewritten (`scripts/catalog/images.ts`);
 * - turns a pattern the manifest marks `recolor: "mask"` into ink in an alpha
 *   channel, so a leaf dye can be poured into it (`scripts/catalog/mask.ts`),
 *   cut to whole repeats of the drawing it holds (`scripts/catalog/period.ts`);
 * - rewrites **only** the community entries of `public/catalog/patterns.json`,
 *   leaving every drawn placeholder exactly as it is
 *   (`scripts/catalog/patternsFile.ts`);
 * - deletes community assets nothing refers to any more;
 * - scores each tile's seams and warns where one will show where it repeats
 *   (`scripts/catalog/seams.ts`);
 * - says what it did: added, updated, removed, unchanged.
 *
 * Two rules hold it together. **The id is the identity**: a file re-exported
 * under a new name keeps its id, so designs people have already made keep
 * their pattern. And **running it twice changes nothing** — same manifest,
 * same artwork, no diff — which is what makes it safe to run before every PR.
 *
 * Dropping an entry from the manifest deletes the pattern, and a design that
 * used it loses that layer. That is a warning here, not a refusal: the catalog
 * is the designer's to decide.
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  assetHash,
  convert,
  describeRect,
  maskVariant,
  TARGET_BYTES,
  type Cropped,
  type MaskOptions,
} from './catalog/images.ts'
import { describeLevels } from './catalog/mask.ts'
import {
  COMMUNITY_TAG,
  idOf,
  loadManifest,
  ManifestError,
  MANIFEST_NAME,
  type ManifestEntry,
} from './catalog/manifest.ts'
import {
  communityItems,
  entryValue,
  rewriteCommunityEntries,
  type CommunityEntry,
} from './catalog/patternsFile.ts'
import { seamWarnings, type Seams } from './catalog/seams.ts'

const USAGE = 'usage: npm run catalog:import -- <folder with the artwork>'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Where the imported assets land, and where the catalog lists them. */
const OUT_DIR = path.join(ROOT, 'public/catalog/patterns/community')
const CATALOG_PATH = path.join(ROOT, 'public/catalog/patterns.json')

/** The public path of the folder `OUT_DIR` is served at. */
const PUBLIC_DIR = '/catalog/patterns/community'

export type Status = 'added' | 'updated' | 'unchanged'

export type Change = {
  id: string
  status: Status
  /** For an update: what about it changed. */
  imageChanged: boolean
  detailsChanged: boolean
}

export type ImportResult = {
  changes: Change[]
  /** Ids that were in the catalog and are not in the manifest any more. */
  removed: string[]
  /** Asset file names written and deleted this run. */
  written: string[]
  deleted: string[]
  catalogChanged: boolean
}

export type ImportOptions = {
  /** The folder holding the artwork and its manifest. */
  sourceDir: string
  catalogPath?: string
  outDir?: string
  log?: (line: string) => void
  warn?: (line: string) => void
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`

/** Deep equality by value, so key order in the file does not count. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`

  if (typeof value === 'object' && value !== null) {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, inner]) => `${JSON.stringify(key)}:${canonical(inner)}`)
      .join(',')}}`
  }

  return JSON.stringify(value) ?? 'null'
}

/** The `src` an entry in the catalog already holds, if it reads as one. */
function srcOf(value: unknown): string | undefined {
  return typeof value === 'object' &&
    value !== null &&
    'src' in value &&
    typeof value.src === 'string'
    ? value.src
    : undefined
}

/** An entry with its two file names dropped, for comparing the rest. */
function withoutAssets(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value

  const copy: Record<string, unknown> = { ...value }
  delete copy.src
  delete copy.thumbnail

  return copy
}

/** How this entry is converted, or nothing where it is taken as it is. */
const maskOptions = (entry: ManifestEntry): MaskOptions | undefined =>
  entry.recolor === 'mask'
    ? { levels: entry.maskLevels, crop: entry.crop }
    : undefined

/** The catalog entry a manifest entry becomes, once its files are named. */
function catalogEntry(entry: ManifestEntry, hash: string): CommunityEntry {
  const stem = `${entry.id}.${hash}`

  return {
    id: entry.id,
    name: entry.name,
    src: `${PUBLIC_DIR}/${stem}.webp`,
    thumbnail: `${PUBLIC_DIR}/${stem}-thumb.webp`,
    recolor: entry.recolor,
    defaultColors: entry.defaultColors,
    repeatUnits: entry.repeatUnits,
    fit: entry.fit,
    restrictTo: entry.restrictTo,
    // Every community pattern carries the tag the library sorts on, whether
    // or not the manifest bothered to repeat it.
    tags: [...new Set([COMMUNITY_TAG, ...entry.tags])],
    credit: entry.credit,
    license: entry.license,
  }
}

/** The file name part of a catalog asset path. */
const basename = (publicPath: string) =>
  publicPath.slice(publicPath.lastIndexOf('/') + 1)

/**
 * What was cut out of the artwork and why — and, where an axis kept its full
 * extent, that nothing was found to cut it on. That last line is the one
 * worth printing: a pattern whose repeat could not be measured is a pattern
 * that will still show its seam, and the designer is the only one who can fix
 * it, by exporting the drawing as a tile.
 */
function reportCrop(
  cropped: Cropped,
  log: (line: string) => void,
  warn: (line: string) => void,
) {
  const { rect, from, byHand, periods } = cropped
  const said = (period: number | null) =>
    period === null ? 'whole' : String(period)

  log(
    `      crop  ${String(from.width)}×${String(from.height)} → ${describeRect(rect)}` +
      (byHand
        ? '  (from the manifest)'
        : `  (repeat ${said(periods.x)} × ${said(periods.y)})`),
  )

  const loose = byHand
    ? []
    : [
        periods.x === null ? 'across' : undefined,
        periods.y === null ? 'down' : undefined,
      ].filter((axis) => axis !== undefined)

  if (loose.length > 0) {
    warn(
      `      WARNING: no repeat found ${loose.join(' or ')} the drawing, so that` +
        ' edge is\n               left as it was delivered. Ask for a seamless' +
        ' export, or give\n               the window to cut with "crop" in the manifest.',
    )
  }
}

function reportSeams(
  seams: Seams,
  log: (line: string) => void,
  warn: (line: string) => void,
) {
  const say = (seam: { score: number; noise: number }) =>
    `${seam.score.toFixed(1)} (grain ${seam.noise.toFixed(1)})`

  log(
    `      seam  left|right ${say(seams.horizontal)}   top|bottom ${say(seams.vertical)}`,
  )

  const edges = seamWarnings(seams)

  if (edges.length > 0) {
    warn(
      `      WARNING: the ${edges.join(' and ')} edges do not meet — this tile` +
        ' will show a seam where it repeats.\n' +
        '               Fine for a pattern placed once (fit: "area");' +
        ' otherwise ask for a seamless export.',
    )
  }
}

export async function importPatterns({
  sourceDir,
  catalogPath = CATALOG_PATH,
  outDir = OUT_DIR,
  log = (line) => {
    console.log(line)
  },
  warn = (line) => {
    console.warn(line)
  },
}: ImportOptions): Promise<ImportResult> {
  const manifestPath = path.join(sourceDir, MANIFEST_NAME)
  const manifest = await loadManifest(sourceDir)

  const catalogText = await readFile(catalogPath, 'utf8')
  const existing = new Map(
    communityItems(catalogText).map((item) => [idOf(item), item]),
  )

  await mkdir(outDir, { recursive: true })

  const entries: CommunityEntry[] = []
  const changes: Change[] = []
  const written: string[] = []

  log(`${manifestPath} — ${String(manifest.patterns.length)} patterns\n`)

  for (const entry of manifest.patterns) {
    const file = path.join(sourceDir, entry.file)
    let source: Buffer

    try {
      source = await readFile(file)
    } catch (error) {
      throw new ManifestError(
        manifestPath,
        [`entry "${entry.id}" file: "${entry.file}" is not in ${sourceDir}`],
        { cause: error },
      )
    }

    const mask = maskOptions(entry)
    const next = catalogEntry(entry, assetHash(source, maskVariant(mask)))
    const before = existing.get(entry.id)
    const imageChanged = before !== undefined && srcOf(before) !== next.src
    // Everything but the two file names, which the image already accounts
    // for: this is a name edited in the manifest, a repeat size reconsidered,
    // a credit filled in.
    const detailsChanged =
      before !== undefined &&
      canonical(withoutAssets(before)) !==
        canonical(withoutAssets(entryValue(next)))

    const status: Status =
      before === undefined
        ? 'added'
        : imageChanged || detailsChanged
          ? 'updated'
          : 'unchanged'

    entries.push(next)
    changes.push({ id: entry.id, status, imageChanged, detailsChanged })

    const names = [basename(next.src), basename(next.thumbnail)]
    const present = await Promise.all(
      names.map((name) =>
        readFile(path.join(outDir, name)).then(
          () => true,
          () => false,
        ),
      ),
    )

    // The hash is in the file name, so a file that is already there holds
    // exactly these pixels: converting it again would spend ten seconds to
    // write the same bytes.
    if (present.every(Boolean)) {
      log(
        `  ${mark(status)} ${entry.id}  ${describe(status, imageChanged, detailsChanged)}`,
      )
      continue
    }

    const converted = await convert(source, mask)

    await writeFile(path.join(outDir, names[0]), converted.pattern.buffer)
    await writeFile(path.join(outDir, names[1]), converted.thumb.buffer)
    written.push(...names)

    log(
      `  ${mark(status)} ${entry.id}  ${describe(status, imageChanged, detailsChanged)}\n` +
        `      ${String(converted.source.width)}×${String(converted.source.height)} ${kb(converted.source.bytes)}` +
        `  →  ${String(converted.pattern.width)}×${String(converted.pattern.height)} ` +
        `${kb(converted.pattern.buffer.length)} at q${String(converted.pattern.quality)}` +
        `, thumb ${kb(converted.thumb.buffer.length)}`,
    )

    if (converted.levels !== undefined) {
      log(
        `      ink mask  levels ${describeLevels(converted.levels)}` +
          `${entry.maskLevels === undefined ? ' (read from the drawing)' : ' (from the manifest)'}` +
          `, painted in ${entry.defaultColors.join(' ')}`,
      )
    }

    if (converted.cropped !== undefined)
      reportCrop(converted.cropped, log, warn)

    if (converted.overTarget) {
      warn(
        `      WARNING: still over ${kb(TARGET_BYTES)} at the lowest quality tried.\n` +
          '               Ask for a flatter export, or accept the weight.',
      )
    }

    reportSeams(converted.seams, log, warn)
  }

  const kept = new Set(entries.map((entry) => entry.id))
  const removed = [...existing.keys()].filter((id) => !kept.has(id))

  for (const id of removed) {
    log(`  - ${id}  removed`)
    warn(
      `      WARNING: "${id}" is gone from the manifest, so it is gone from the\n` +
        '               catalog. A saved design that used it loses that layer.',
    )
  }

  const nextText = await rewriteCommunityEntries(catalogText, entries)
  const catalogChanged = nextText !== catalogText

  if (catalogChanged) await writeFile(catalogPath, nextText)

  // Anything in the folder that no entry names: an old revision of a pattern,
  // or a pattern that has been dropped.
  const referenced = new Set(
    entries.flatMap((entry) => [
      basename(entry.src),
      basename(entry.thumbnail),
    ]),
  )
  const deleted = (await readdir(outDir)).filter(
    (name) => !referenced.has(name),
  )

  for (const name of deleted) await rm(path.join(outDir, name))

  log(
    `\n${catalogChanged ? 'patterns.json updated' : 'patterns.json unchanged'}` +
      ` · ${String(written.length)} asset${written.length === 1 ? '' : 's'} written` +
      `, ${String(deleted.length)} deleted`,
  )

  return { changes, removed, written, deleted, catalogChanged }
}

const mark = (status: Status) =>
  status === 'added' ? '+' : status === 'updated' ? '~' : '='

function describe(
  status: Status,
  imageChanged: boolean,
  detailsChanged: boolean,
): string {
  if (status !== 'updated') return status

  const what = [
    imageChanged ? 'image' : undefined,
    detailsChanged ? 'details' : undefined,
  ].filter((part) => part !== undefined)

  return `updated (${what.join(' + ')})`
}

/** Run only when this file is the command, so a test may import it. */
const isCommand =
  path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)

if (isCommand) {
  const [sourceDir, ...rest] = process.argv.slice(2)

  if (sourceDir === undefined || rest.length > 0) {
    console.error(USAGE)
    process.exitCode = 1
  } else {
    await importPatterns({ sourceDir: path.resolve(sourceDir) }).catch(
      (error: unknown) => {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      },
    )
  }
}
