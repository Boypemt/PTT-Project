/**
 * Turns the designer's exported artwork into catalog assets.
 *
 *   npm run catalog:import -- "../Design Pattern"
 *
 * A pattern arrives as a print-resolution PNG — 2480×3508 at 300 dpi is what
 * an A4 artboard exports, which is 20 MB of pixels nobody's phone will ever
 * draw. This writes the two files the catalog actually wants into
 * `public/catalog/patterns/community/`: the pattern itself as a WebP with a
 * long edge of 1600 px, and a thumbnail for the library at 240 px. Nothing
 * from the source directory is copied, moved or changed — the originals are
 * the designer's masters and stay outside the repo.
 *
 * The file name becomes the pattern's id (`Pastel stripes.png` →
 * `pastel-stripes`), so the designer names a file after the pattern and the
 * id, the asset paths and the catalog entry all follow from it.
 *
 * It never edits patterns.json: it prints an entry to paste for any id the
 * catalog does not have yet, because the name, the repeat size and whether a
 * pattern repeats at all are decisions, not something a script should guess.
 *
 * ## The seam score
 *
 * A tile is printed over and over across the cloth, so its left edge lands
 * against its right edge and its top against its bottom. Where the drawing
 * does not continue across that join, the repeat shows as a grid of seams.
 * For each axis this prints how different the two edges are, 0 (they meet
 * exactly) to 100, next to the difference between two neighbouring columns
 * *inside* the picture. That second number is what makes the first readable:
 * a grainy hand-drawn wash has a noisy interior, so an edge difference of 2
 * there means nothing, while on a flat vector drawing it is a visible line.
 *
 * It is a warning and never an error. A pattern meant to be placed once
 * rather than repeated (`fit: "area"` in the catalog) has edges that were
 * never supposed to meet, and plenty of patterns look fine with a soft seam.
 * The designer decides; this only points.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import sharp, { type Sharp } from 'sharp'

const USAGE = 'usage: npm run catalog:import -- <source dir>'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Where the imported assets land, and the public path they are served at. */
const OUT_DIR = path.join(ROOT, 'public/catalog/patterns/community')
const CATALOG_PATH = path.join(ROOT, 'public/catalog/patterns.json')

/** What the designer exports from. */
const SOURCES = ['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff']

/** Long edge of the pattern itself: more than a phone draws it at. */
const LONG_EDGE = 1600

/** Long edge of the library thumbnail. */
const THUMB_EDGE = 240

/** What one pattern may weigh before the quality comes down. */
const TARGET_BYTES = 600 * 1024

/** Tried in order; the first that fits `TARGET_BYTES` wins. */
const QUALITIES = [82, 74, 66, 58, 50]

const THUMB_QUALITY = 70

/** An edge difference below this is never worth saying anything about. */
const SEAM_FLOOR = 2

/** …nor is one this close to the picture's own grain. */
const SEAM_OVER_NOISE = 2

type Encoded = {
  buffer: Buffer
  quality: number
  /** The size it came out at, which the source's long edge decides. */
  width: number
  height: number
}

type Seam = {
  /** How different the two edges that meet in the repeat are, 0–100. */
  score: number
  /** How different two neighbouring columns inside the picture are, 0–100. */
  noise: number
}

type Report = {
  id: string
  file: string
  sourceBytes: number
  width: number
  height: number
  pattern: Encoded
  thumb: Encoded
  seams: Seams
}

/** `Pastel stripes.png` → `pastel-stripes`, the id the catalog will use. */
export function idFromFile(file: string): string {
  const base = path.basename(file, path.extname(file))

  return base
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`

/** The pattern at its catalog size, upright, and flattened if it can be. */
async function prepared(file: string) {
  // `rotate()` with no angle applies the EXIF orientation, which a photo of
  // dyed cloth carries and a canvas export does not.
  const base = sharp(file).rotate().resize({
    width: LONG_EDGE,
    height: LONG_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const { isOpaque } = await sharp(file).stats()

  // An opaque PNG still carries an alpha channel, and keeping it costs bytes
  // for a channel that says "all of it". A pattern that really is transparent
  // keeps it: that is a motif cut out of its background.
  return isOpaque ? base.flatten({ background: '#ffffff' }) : base
}

/** The smallest quality that fits the target, or the lowest one tried. */
async function encode(image: Sharp): Promise<Encoded> {
  let last: Encoded | undefined

  for (const quality of QUALITIES) {
    const { data, info } = await image
      .clone()
      .webp({ quality })
      .toBuffer({ resolveWithObject: true })
    last = { buffer: data, quality, width: info.width, height: info.height }

    if (data.length <= TARGET_BYTES) return last
  }

  // Every quality tried and still over: the caller says so rather than
  // grinding the pattern down until it is mush.
  if (last === undefined) throw new Error('no WebP qualities to try')

  return last
}

/** The library swatch. Small enough that one quality is the whole ladder. */
async function thumbnail(image: Sharp): Promise<Encoded> {
  const { data, info } = await image
    .clone()
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside' })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    quality: THUMB_QUALITY,
    width: info.width,
    height: info.height,
  }
}

/**
 * Mean absolute difference between two columns (or rows) of pixels, 0–100.
 * Channels are averaged, which is enough to tell "the drawing continues" from
 * "it stops" without weighing one colour against another.
 */
function lineDiff(
  data: Buffer,
  channels: number,
  stride: number,
  lines: number,
  a: number,
  b: number,
): number {
  let total = 0

  for (let i = 0; i < lines; i += 1) {
    const left = (i * stride + a) * channels
    const right = (i * stride + b) * channels

    for (let c = 0; c < channels; c += 1) {
      total += Math.abs(data[left + c] - data[right + c])
    }
  }

  return (total / (lines * channels) / 255) * 100
}

/** The typical difference between neighbours, sampled across the picture. */
function noiseOf(diff: (a: number, b: number) => number, size: number): number {
  if (size < 2) return 0

  // Three places across the picture, each compared with the line next to it —
  // and never with itself, which the last one would be at the far edge.
  const sampled = [0.25, 0.5, 0.75]
    .map((f) => Math.min(Math.floor(size * f), size - 2))
    .map((x) => diff(x, x + 1))

  return sampled.reduce((sum, value) => sum + value, 0) / sampled.length
}

export type Seams = { horizontal: Seam; vertical: Seam }

/**
 * The seam scores of a picture held as raw, interleaved pixels — what
 * `sharp(…).raw()` hands over, and the whole of the measurement.
 */
export function seamsOfRaw(
  data: Buffer,
  {
    width,
    height,
    channels,
  }: { width: number; height: number; channels: number },
): Seams {
  // Left edge against right edge: the join when the tile repeats sideways.
  const columns = (a: number, b: number) =>
    lineDiff(data, channels, width, height, a, b)

  // And the same down the picture, reading it a row at a time.
  const rows = (a: number, b: number) =>
    lineDiff(data, channels, 1, width, a * width, b * width)

  return {
    horizontal: {
      score: columns(0, width - 1),
      noise: noiseOf(columns, width),
    },
    vertical: {
      score: rows(0, height - 1),
      noise: noiseOf(rows, height),
    },
  }
}

async function seamsOf(image: Sharp): Promise<Seams> {
  const { data, info } = await image
    .clone()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return seamsOfRaw(data, info)
}

/**
 * Whether a seam is worth saying anything about: far enough from zero to see,
 * and far enough above the picture's own grain that it is the drawing
 * stopping rather than the paper.
 */
export const seamWarns = (seam: Seam) =>
  seam.score > SEAM_FLOOR && seam.score > seam.noise * SEAM_OVER_NOISE

function reportSeams(report: Report): void {
  const { horizontal, vertical } = report.seams
  const say = (seam: Seam) =>
    `${seam.score.toFixed(1)} (grain ${seam.noise.toFixed(1)})`

  console.log(
    `    seam  left|right ${say(horizontal)}   top|bottom ${say(vertical)}`,
  )

  const edges = [
    seamWarns(horizontal) ? 'left|right' : undefined,
    seamWarns(vertical) ? 'top|bottom' : undefined,
  ].filter((edge) => edge !== undefined)

  if (edges.length > 0) {
    console.warn(
      `    WARNING: the ${edges.join(' and ')} edges do not meet — this tile will show a seam where it repeats.`,
      '\n             Fine for a pattern placed once (fit: "area"); otherwise ask for a seamless export.',
    )
  }
}

async function convert(file: string): Promise<Report> {
  const source = await readFile(file)
  const image = await prepared(file)
  // The size as delivered: `metadata()` on a pipeline reads its input, so
  // what comes out is on the encoded buffers instead.
  const { width = 0, height = 0 } = await sharp(file).metadata()

  const [pattern, thumb, seams] = await Promise.all([
    encode(image),
    thumbnail(image),
    seamsOf(image),
  ])

  return {
    id: idFromFile(file),
    file: path.basename(file),
    sourceBytes: source.length,
    width,
    height,
    pattern,
    thumb,
    seams,
  }
}

/** The entry to paste into patterns.json, with the decisions left blank. */
function stubFor(report: Report): string {
  return JSON.stringify(
    {
      id: report.id,
      name: { th: 'TODO', en: 'TODO' },
      kind: 'tile',
      src: `/catalog/patterns/community/${report.id}.webp`,
      thumbnail: `/catalog/patterns/community/${report.id}-thumb.webp`,
      recolorable: false,
      repeatUnits: 500,
      defaultColors: [],
      tags: ['community'],
      source: {
        type: 'community',
        credit: 'TODO',
        license: 'TODO',
      },
    },
    null,
    2,
  )
}

/** The ids patterns.json already holds, so the stubs are only the new ones. */
async function knownIds(): Promise<Set<string>> {
  try {
    const text = await readFile(CATALOG_PATH, 'utf8')
    const parsed: unknown = JSON.parse(text)
    const items =
      typeof parsed === 'object' && parsed !== null && 'items' in parsed
        ? (parsed as { items: { id?: string }[] }).items
        : []

    return new Set(items.map((item) => item.id ?? ''))
  } catch {
    // No catalog to compare against is not this script's problem: it writes
    // files, and every id is then a new one.
    return new Set()
  }
}

async function importPatterns(sourceDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true })
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        SOURCES.includes(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => path.join(sourceDir, entry.name))
    .sort((a, b) => a.localeCompare(b))

  if (files.length === 0) {
    throw new Error(
      `no images in ${sourceDir} (looked for ${SOURCES.join(', ')})`,
    )
  }

  await mkdir(OUT_DIR, { recursive: true })

  const reports: Report[] = []

  for (const file of files) {
    const report = await convert(file)
    const base = path.join(OUT_DIR, report.id)

    await writeFile(`${base}.webp`, report.pattern.buffer)
    await writeFile(`${base}-thumb.webp`, report.thumb.buffer)

    reports.push(report)

    console.log(`\n${report.file}  →  ${report.id}`)
    console.log(
      `    ${report.width}×${report.height} ${kb(report.sourceBytes)}` +
        `  →  ${report.pattern.width}×${report.pattern.height} ` +
        `${kb(report.pattern.buffer.length)} at q${report.pattern.quality}` +
        `, thumb ${report.thumb.width}×${report.thumb.height} ` +
        `${kb(report.thumb.buffer.length)}`,
    )

    if (report.pattern.buffer.length > TARGET_BYTES) {
      console.warn(
        `    WARNING: still over ${kb(TARGET_BYTES)} at the lowest quality tried.`,
        '\n             Ask for a flatter export, or accept the weight.',
      )
    }

    reportSeams(report)
  }

  const known = await knownIds()
  const missing = reports.filter((report) => !known.has(report.id))

  if (missing.length === 0) {
    console.log('\nEvery pattern is already in patterns.json.')
    return
  }

  console.log(
    `\nNot in patterns.json yet. Paste ${missing.length === 1 ? 'this entry' : 'these entries'} into its "items",` +
      ' then fill in the names, the repeat size and the credit:\n',
  )
  console.log(missing.map(stubFor).join(',\n'))
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
    await importPatterns(path.resolve(sourceDir)).catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    })
  }
}
