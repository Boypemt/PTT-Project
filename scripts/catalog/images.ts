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
import {
  describeLevels,
  histogramOf,
  inkMask,
  levelsFromHistogram,
  maskLut,
  type MaskLevels,
} from './mask.ts'
import { type AlphaMap, cropAxis, SEARCH_EDGE } from './period.ts'
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
  // v2: a mask is cropped to whole repeats of its own drawing before it is
  // resized, so every mask in the catalog is rebuilt under a new name.
  'v2',
  LONG_EDGE,
  THUMB_EDGE,
  TARGET_BYTES,
  QUALITIES.join('-'),
  THUMB_QUALITY,
].join('|')

/**
 * Eight hex characters: short enough to read, long enough to be unique.
 *
 * `variant` is whatever else decides what comes out of the same bytes — today
 * that the artwork is converted to an ink mask, and the levels if they were
 * given by hand. Levels the import reads for itself are not in it and do not
 * need to be: they are a function of these same bytes and this same recipe.
 */
export function assetHash(source: Buffer, variant = ''): string {
  return createHash('sha256')
    .update(RECIPE)
    .update(variant)
    .update(source)
    .digest('hex')
    .slice(0, 8)
}

/** What `assetHash` is told about a mask conversion, or '' for an ordinary one. */
export const maskVariant = (mask: MaskOptions | undefined): string => {
  if (mask === undefined) return ''

  const levels =
    mask.levels === undefined ? 'auto' : describeLevels(mask.levels)
  // A crop the import works out for itself is a function of these same bytes
  // and this same recipe, so only one given by hand has to be named here.
  const crop = mask.crop === undefined ? '' : `+crop:${describeRect(mask.crop)}`

  return `mask:${levels}${crop}`
}

export type Encoded = {
  buffer: Buffer
  quality: number
  /** The size it came out at, which the source's long edge decides. */
  width: number
  height: number
}

/** A window on the artwork, in the pixels it was delivered at. */
export type Rect = { x: number; y: number; width: number; height: number }

export const describeRect = ({ x, y, width, height }: Rect): string =>
  `${String(width)}×${String(height)} at ${String(x)},${String(y)}`

/** Convert this one to an ink mask, at these levels or at read ones. */
export type MaskOptions = {
  levels?: MaskLevels
  /** The window to take, instead of the one the repeat would decide. */
  crop?: Rect
}

/** What was cut out of the artwork, and what decided it. */
export type Cropped = {
  rect: Rect
  /** The artwork's own size, upright, for reporting what changed. */
  from: { width: number; height: number }
  /** True where the manifest said where to cut rather than the drawing. */
  byHand: boolean
  /** The repeat found on each axis; `null` is an axis left whole. */
  periods: { x: number | null; y: number | null }
}

export type Converted = {
  /** The artwork as delivered. */
  source: { bytes: number; width: number; height: number }
  pattern: Encoded
  thumb: Encoded
  seams: Seams
  /** The levels the ink was read at, where this was converted to a mask. */
  levels?: MaskLevels
  /** What was cut out of it, where this was converted to a mask. */
  cropped?: Cropped
  /** True where even the lowest quality tried is over `TARGET_BYTES`. */
  overTarget: boolean
}

/** The pattern at its catalog size, upright, and flattened if it can be. */
async function prepared(
  source: Buffer,
  mask: MaskOptions | undefined,
  crop: Rect | undefined,
): Promise<Sharp> {
  // `rotate()` with no angle applies the EXIF orientation, which a photo of
  // dyed cloth carries and a canvas export does not.
  const upright = sharp(source).rotate()

  // Cut to the repeat before anything else: the resize below decides how many
  // pixels a repeat is worth, and cropping after it would throw away
  // precision the measurement was made at.
  const window =
    crop === undefined
      ? upright
      : upright.extract({
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height,
        })

  const base = window.resize({
    width: LONG_EDGE,
    height: LONG_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  })

  // A mask's transparency comes from the ink, not from the file, so there is
  // nothing to flatten against and the page is about to be thrown away.
  if (mask !== undefined) return base

  const { isOpaque } = await sharp(source).stats()

  // An opaque PNG still carries an alpha channel, and keeping it costs bytes
  // for a channel that says "all of it". A pattern that really is transparent
  // keeps it: that is a motif cut out of its background.
  return isOpaque ? base.flatten({ background: '#ffffff' }) : base
}

/**
 * The drawing as a stencil: black throughout, its ink in the alpha channel.
 *
 * Resized first and masked after, so the levels are read from the pixels the
 * catalog will actually serve — downsampling averages a JPEG's ringing away,
 * and reading the full-resolution page would set the points against noise
 * that is no longer there by the time it is applied.
 */
async function stencil(
  image: Sharp,
  { levels }: MaskOptions,
): Promise<{ image: Sharp; levels: MaskLevels }> {
  const { data, info } = await image
    .clone()
    .removeAlpha()
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.channels !== 1) {
    throw new Error(
      `expected one greyscale channel, got ${String(info.channels)}`,
    )
  }

  const read = levels ?? levelsFromHistogram(histogramOf(data))

  return {
    image: sharp(inkMask(data, read), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }),
    levels: read,
  }
}

/** The artwork read as ink coverage, which is what a repeat is measured in. */
async function alphaMapOf(
  image: Sharp,
  levels: MaskLevels | undefined,
): Promise<{ map: AlphaMap; levels: MaskLevels }> {
  const { data, info } = await image
    .removeAlpha()
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })

  const read = levels ?? levelsFromHistogram(histogramOf(data))
  const lut = maskLut(read)
  const alpha = new Uint8Array(data.length)

  for (let at = 0; at < data.length; at += 1) alpha[at] = lut[data[at]]

  return {
    map: { data: alpha, width: info.width, height: info.height },
    levels: read,
  }
}

/** A window the artwork does not contain is a mistake worth naming. */
function assertFits(crop: Rect, size: { width: number; height: number }): void {
  const fits =
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.x + crop.width <= size.width &&
    crop.y + crop.height <= size.height

  if (!fits) {
    throw new Error(
      `crop ${describeRect(crop)} does not fit the artwork` +
        ` (${String(size.width)}×${String(size.height)})`,
    )
  }
}

/**
 * The window to take out of the artwork: whole repeats of the drawing it
 * holds, or the window the manifest named.
 *
 * Measured on the artwork as delivered rather than on the resized copy,
 * because the crop is applied before the resize — see `prepared` — and a
 * period worked out at a fifth of the size is a period a few pixels wrong.
 */
async function cropFor(source: Buffer, mask: MaskOptions): Promise<Cropped> {
  const upright = sharp(source).rotate()
  const full = await alphaMapOf(upright.clone(), mask.levels)
  const from = { width: full.map.width, height: full.map.height }

  if (mask.crop !== undefined) {
    assertFits(mask.crop, from)

    return {
      rect: mask.crop,
      from,
      byHand: true,
      periods: { x: null, y: null },
    }
  }

  const search = await alphaMapOf(
    upright.clone().resize({
      width: SEARCH_EDGE,
      height: SEARCH_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    }),
    // The same levels at both sizes, so the search and the refinement are
    // looking at the same drawing.
    full.levels,
  )

  const x = cropAxis(full.map, search.map, 'x')
  const y = cropAxis(full.map, search.map, 'y')

  return {
    rect: { x: x.start, y: y.start, width: x.length, height: y.length },
    from,
    byHand: false,
    periods: { x: x.period, y: y.period },
  }
}

/**
 * Lossy throughout, except a mask's alpha: the alpha *is* the drawing there,
 * and the three colour channels under it are a flat black the encoder spends
 * almost nothing on, so the quality ladder below has little left to trade.
 */
const webpFor = (mask: boolean) => (mask ? { alphaQuality: 100 } : {})

/** The smallest quality that fits the target, or the lowest one tried. */
async function encode(image: Sharp, webp: object): Promise<Encoded> {
  let last: Encoded | undefined

  for (const quality of QUALITIES) {
    const { data, info } = await image
      .clone()
      .webp({ quality, ...webp })
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
async function thumbnail(image: Sharp, webp: object): Promise<Encoded> {
  const { data, info } = await image
    .clone()
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside' })
    .webp({ quality: THUMB_QUALITY, ...webp })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    quality: THUMB_QUALITY,
    width: info.width,
    height: info.height,
  }
}

/**
 * A mask's drawing is its alpha — the colour channels are a flat black that
 * would score every seam a perfect 0.0 — so that is the channel the edges are
 * read from. For everything else the picture is the colour.
 */
async function seamsOf(image: Sharp, mask: boolean): Promise<Seams> {
  const flattened = mask
    ? image.clone().extractChannel(3)
    : image.clone().removeAlpha()
  const { data, info } = await flattened
    .raw()
    .toBuffer({ resolveWithObject: true })

  return seamsOfRaw(data, info)
}

/** Converts one piece of artwork, held in memory. */
export async function convert(
  source: Buffer,
  mask?: MaskOptions,
): Promise<Converted> {
  const cropped = mask === undefined ? undefined : await cropFor(source, mask)
  const page = await prepared(source, mask, cropped?.rect)
  const inked = mask === undefined ? undefined : await stencil(page, mask)
  const image = inked?.image ?? page
  const webp = webpFor(mask !== undefined)

  // The size as delivered: `metadata()` on a pipeline reads its input.
  const { width = 0, height = 0 } = await sharp(source).metadata()

  const [pattern, thumb, seams] = await Promise.all([
    encode(image, webp),
    thumbnail(image, webp),
    seamsOf(image, mask !== undefined),
  ])

  return {
    source: { bytes: source.length, width, height },
    pattern,
    thumb,
    seams,
    levels: inked?.levels,
    cropped,
    overTarget: pattern.buffer.length > TARGET_BYTES,
  }
}
