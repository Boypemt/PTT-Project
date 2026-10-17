/**
 * The designer's artwork, converted to what the catalog serves.
 *
 * A pattern arrives as a print-resolution PNG — 2480×3508 is what an A4
 * artboard exports, which is 20 MB of pixels nobody's phone will ever draw.
 * Each one becomes two WebPs: the pattern at a long edge of 1600 px, and a
 * 240 px thumbnail for the library. The originals are the designer's masters
 * and are never copied, moved or changed.
 *
 * Each file is named with a hash of the artwork it came from
 * (`lemons.3f1c9a02.webp`). That is what makes a revision safe to ship: a new
 * drawing is a new file name, so no browser, CDN or service worker can serve
 * last week's picture from a cache, and the same drawing re-imported produces
 * the same name, so running the import twice changes nothing. The hash covers
 * the conversion settings too — change the long edge or the quality ladder
 * below and every pattern is rebuilt under a new name, rather than the catalog
 * quietly holding files made by two different recipes.
 */
import { createHash } from 'node:crypto'
import sharp, { type Sharp } from 'sharp'
import { seamsOfRaw, type Seams } from './seams.ts'

/** What the designer exports from. */
export const SOURCE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tif',
  '.tiff',
]

/** Long edge of the pattern itself: more than a phone draws it at. */
const LONG_EDGE = 1600

/** Long edge of the library thumbnail. */
const THUMB_EDGE = 240

/** What one pattern may weigh before the quality comes down. */
export const TARGET_BYTES = 600 * 1024

/** Tried in order; the first that fits `TARGET_BYTES` wins. */
const QUALITIES = [82, 74, 66, 58, 50]

const THUMB_QUALITY = 70

/**
 * Everything that decides what comes out, folded into the hash. Bump the
 * leading version by hand if sharp's own output ever changes under us.
 */
const RECIPE = [
  'v1',
  LONG_EDGE,
  THUMB_EDGE,
  TARGET_BYTES,
  QUALITIES.join('-'),
  THUMB_QUALITY,
].join('|')

/** Eight hex characters: short enough to read, long enough to be unique. */
export function assetHash(source: Buffer): string {
  return createHash('sha256')
    .update(RECIPE)
    .update(source)
    .digest('hex')
    .slice(0, 8)
}

export type Encoded = {
  buffer: Buffer
  quality: number
  /** The size it came out at, which the source's long edge decides. */
  width: number
  height: number
}

export type Converted = {
  /** The artwork as delivered. */
  source: { bytes: number; width: number; height: number }
  pattern: Encoded
  thumb: Encoded
  seams: Seams
  /** True where even the lowest quality tried is over `TARGET_BYTES`. */
  overTarget: boolean
}

/** The pattern at its catalog size, upright, and flattened if it can be. */
async function prepared(source: Buffer): Promise<Sharp> {
  // `rotate()` with no angle applies the EXIF orientation, which a photo of
  // dyed cloth carries and a canvas export does not.
  const base = sharp(source).rotate().resize({
    width: LONG_EDGE,
    height: LONG_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const { isOpaque } = await sharp(source).stats()

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

async function seamsOf(image: Sharp): Promise<Seams> {
  const { data, info } = await image
    .clone()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return seamsOfRaw(data, info)
}

/** Converts one piece of artwork, held in memory. */
export async function convert(source: Buffer): Promise<Converted> {
  const image = await prepared(source)
  // The size as delivered: `metadata()` on a pipeline reads its input.
  const { width = 0, height = 0 } = await sharp(source).metadata()

  const [pattern, thumb, seams] = await Promise.all([
    encode(image),
    thumbnail(image),
    seamsOf(image),
  ])

  return {
    source: { bytes: source.length, width, height },
    pattern,
    thumb,
    seams,
    overTarget: pattern.buffer.length > TARGET_BYTES,
  }
}
