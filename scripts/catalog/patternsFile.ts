/**
 * Rewriting the community half of `public/catalog/patterns.json`.
 *
 * The file holds two kinds of entry: the drawn placeholders, which are
 * hand-written and belong to whoever edits them, and the community patterns,
 * which the import generates from the manifest. So this does not re-serialize
 * the file — that would reformat every placeholder as a side effect of
 * importing a pattern, and a diff where every entry moved is a diff nobody
 * reads. It keeps the exact source text of each entry it does not own, drops
 * the community entries, and writes the new ones in the manifest's order at
 * the end of the list.
 *
 * Reading the file twice — once as JSON to know what each entry is, once as
 * text to know where it sits — is what that costs. The scanner below is the
 * second half: it walks the `items` array counting braces, minding strings and
 * escapes, and hands back the slice of source each element occupies.
 *
 * What it writes is run through Prettier, so the result is what the repository
 * would have formatted anyway and `npm run format:check` has nothing to say.
 */
import { format } from 'prettier'

/** One element of `items`, as both text and value. */
export type Item = { text: string; value: unknown }

export type SplitItems = {
  /** Everything up to and including the array's `[`. */
  prefix: string
  /** Whitespace between the `[` and the first element. */
  head: string
  items: Item[]
  /** Whitespace between the last element and the `]`. */
  tail: string
  /** Everything from the `]` onwards. */
  suffix: string
  /** The indentation one element sits at. */
  indent: string
}

/** Where the `items` array opens, or `-1` if the file has no such array. */
function itemsBracket(text: string): number {
  const key = text.indexOf('"items"')
  if (key < 0) return -1

  const bracket = text.indexOf('[', key)
  return bracket
}

/**
 * The end of the JSON value starting at `start`, which the scanner needs for
 * objects, arrays and strings alike. Numbers and keywords end at the first
 * character that cannot belong to them.
 */
function endOfValue(text: string, start: number): number {
  const opener = text[start]

  if (opener !== '{' && opener !== '[') {
    const end = /[,\]}\s]/.exec(text.slice(start))
    return end === null ? text.length : start + end.index
  }

  const closer = opener === '{' ? '}' : ']'
  let depth = 0
  let inString = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (char === '\\') i += 1
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === opener) depth += 1
    else if (char === closer) {
      depth -= 1
      if (depth === 0) return i + 1
    }
  }

  throw new Error('patterns.json ends inside an item')
}

/** The source text of every element of `items`, and the gaps around them. */
export function splitItems(text: string): SplitItems {
  const bracket = itemsBracket(text)
  if (bracket < 0) throw new Error('patterns.json has no "items" array')

  const items: Item[] = []
  let cursor = bracket + 1
  let firstStart = -1
  let lastEnd = -1

  for (;;) {
    const rest = text.slice(cursor)
    const nonSpace = /\S/.exec(rest)
    if (nonSpace === null) throw new Error('patterns.json ends inside "items"')

    const at = cursor + nonSpace.index
    if (text[at] === ']') break

    if (text[at] === ',') {
      cursor = at + 1
      continue
    }

    const end = endOfValue(text, at)
    const slice = text.slice(at, end)

    items.push({ text: slice, value: JSON.parse(slice) as unknown })

    if (firstStart < 0) firstStart = at
    lastEnd = end
    cursor = end
  }

  const close = text.indexOf(']', cursor === bracket + 1 ? cursor : lastEnd)
  const empty = items.length === 0

  // An empty list has no element to copy the indentation from, so it takes the
  // indentation of the line the array opens on, plus one step.
  const lineStart = text.lastIndexOf('\n', bracket) + 1
  const openIndent = /^[ \t]*/.exec(text.slice(lineStart))?.[0] ?? ''

  const head = empty ? `\n${openIndent}  ` : text.slice(bracket + 1, firstStart)
  const tail = empty ? `\n${openIndent}` : text.slice(lastEnd, close)

  return {
    prefix: text.slice(0, bracket + 1),
    head,
    items,
    tail,
    suffix: text.slice(close),
    indent: head.slice(head.lastIndexOf('\n') + 1),
  }
}

/** Whether an entry is one the import owns. */
export function isCommunity(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'source' in value &&
    typeof value.source === 'object' &&
    value.source !== null &&
    'type' in value.source &&
    value.source.type === 'community'
  )
}

/** A community entry as the catalog holds it. */
export type CommunityEntry = {
  id: string
  name: { th: string; en: string }
  src: string
  thumbnail: string
  /** `mask` = imported as ink in an alpha channel, so a dye can fill it. */
  recolor?: 'mask'
  /** The dye it is listed in; empty for a pattern that keeps its colours. */
  defaultColors: string[]
  repeatUnits?: number
  fit?: 'repeat' | 'area'
  restrictTo?: { lines?: string[]; productIds?: string[] }
  tags: string[]
  credit: string
  license: string
}

const q = (value: string) => JSON.stringify(value)

/**
 * The same entry as a plain value, for comparing against what the catalog
 * already holds. It must stay in step with `renderEntry` below — a test parses
 * one and compares it with the other, so the two cannot drift apart.
 */
export function entryValue(entry: CommunityEntry): Record<string, unknown> {
  return {
    id: entry.id,
    name: entry.name,
    kind: 'tile',
    src: entry.src,
    thumbnail: entry.thumbnail,
    // A mask is the one imported pattern a leaf dye means anything to; a
    // photograph or a painting carries its colours in the file.
    recolorable: entry.recolor !== undefined,
    ...(entry.recolor === undefined ? {} : { recolor: entry.recolor }),
    ...(entry.repeatUnits === undefined
      ? {}
      : { repeatUnits: entry.repeatUnits }),
    ...(entry.fit === undefined ? {} : { fit: entry.fit }),
    ...(entry.restrictTo === undefined ? {} : { restrictTo: entry.restrictTo }),
    defaultColors: entry.defaultColors,
    tags: entry.tags,
    source: {
      type: 'community',
      credit: entry.credit,
      license: entry.license,
    },
  }
}

/**
 * One entry in the house style: properties one per line, the name on a line of
 * its own, the whole thing ready to sit at `indent` inside the array. Prettier
 * keeps these shapes rather than imposing its own, so this is what the file
 * ends up holding.
 */
export function renderEntry(entry: CommunityEntry, indent = '    '): string {
  const inner = `${indent}  `
  const lines = [
    `${inner}"id": ${q(entry.id)},`,
    `${inner}"name": { "th": ${q(entry.name.th)}, "en": ${q(entry.name.en)} },`,
    `${inner}"kind": "tile",`,
    `${inner}"src": ${q(entry.src)},`,
    `${inner}"thumbnail": ${q(entry.thumbnail)},`,
    `${inner}"recolorable": ${entry.recolor === undefined ? 'false' : 'true'},`,
    ...(entry.recolor === undefined
      ? []
      : [`${inner}"recolor": ${q(entry.recolor)},`]),
    ...(entry.repeatUnits === undefined
      ? []
      : [`${inner}"repeatUnits": ${String(entry.repeatUnits)},`]),
    ...(entry.fit === undefined ? [] : [`${inner}"fit": ${q(entry.fit)},`]),
    ...(entry.restrictTo === undefined
      ? []
      : [`${inner}"restrictTo": ${JSON.stringify(entry.restrictTo)},`]),
    `${inner}"defaultColors": ${JSON.stringify(entry.defaultColors)},`,
    `${inner}"tags": ${JSON.stringify(entry.tags)},`,
    `${inner}"source": {`,
    `${inner}  "type": "community",`,
    `${inner}  "credit": ${q(entry.credit)},`,
    `${inner}  "license": ${q(entry.license)}`,
    `${inner}}`,
  ]

  return `{\n${lines.join('\n')}\n${indent}}`
}

/**
 * `text` with its community entries replaced by `entries`, everything else
 * left exactly as it was. Formatted with Prettier, so re-running the import
 * on an unchanged manifest produces the file it already holds.
 */
export async function rewriteCommunityEntries(
  text: string,
  entries: readonly CommunityEntry[],
): Promise<string> {
  const { prefix, head, items, tail, suffix, indent } = splitItems(text)

  const bodies = [
    ...items
      .filter((item) => !isCommunity(item.value))
      .map((item) => item.text),
    ...entries.map((entry) => renderEntry(entry, indent)),
  ]

  const rebuilt = `${prefix}${head}${bodies.join(`,\n${indent}`)}${tail}${suffix}`

  return format(rebuilt, { parser: 'json' })
}

/** The community entries a catalog file already holds, in file order. */
export function communityItems(text: string): unknown[] {
  return splitItems(text)
    .items.filter((item) => isCommunity(item.value))
    .map((item) => item.value)
}
