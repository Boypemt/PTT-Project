/**
 * The import, run for real against a folder of generated artwork and a
 * throwaway catalog file.
 *
 * sharp and the file system are the point here rather than things to stub: the
 * promises being tested are that a second run changes nothing, that a revised
 * drawing lands under a new name, that dropping an entry takes its files with
 * it, and that the hand-written placeholders come out of all of it untouched.
 * Each picture is a few hundred pixels of flat colour, so the whole file is
 * about as fast as a unit test.
 */
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MANIFEST_NAME } from './catalog/manifest.ts'
import { communityItems } from './catalog/patternsFile.ts'
import { importPatterns } from './importPatterns.ts'

/** A hand-written entry, which the import must never touch. */
const PLACEHOLDER = `    {
      "id": "seigaiha",
      "name": { "th": "ลายคลื่น", "en": "Seigaiha waves" },
      "kind": "tile",
      "src": "/catalog/patterns/seigaiha.svg",
      "recolorable": true,
      "defaultColors": ["#4B2A4F"],
      "tags": ["geometric", "placeholder"],
      "source": {
        "type": "placeholder",
        "credit": "Generated placeholder",
        "license": "CC0-1.0"
      }
    }`

const CATALOG = `{\n  "catalogVersion": 1,\n  "items": [\n${PLACEHOLDER}\n  ]\n}\n`

let dir = ''
let sourceDir = ''
let outDir = ''
let catalogPath = ''

/** A plain rectangle of one colour, in the shape artwork arrives in. */
async function artwork(
  file: string,
  color: string,
  width = 240,
): Promise<void> {
  const image = sharp({
    create: {
      width,
      height: Math.round(width * 1.4),
      channels: 3,
      background: color,
    },
  })

  await image.png().toFile(path.join(sourceDir, file))
}

async function manifest(...patterns: unknown[]): Promise<void> {
  await writeFile(
    path.join(sourceDir, MANIFEST_NAME),
    JSON.stringify({ manifestVersion: 1, patterns }, null, 2),
  )
}

const lemons = (overrides: Record<string, unknown> = {}) => ({
  file: 'lemons.png',
  id: 'lemons',
  name: { th: 'ลายมะนาว', en: 'Lemons' },
  repeatUnits: 500,
  credit: 'Designer TBC',
  ...overrides,
})

const stars = (overrides: Record<string, unknown> = {}) => ({
  file: 'stars.png',
  id: 'stars',
  name: { th: 'ลายดาว', en: 'Stars' },
  repeatUnits: 500,
  credit: 'Designer TBC',
  ...overrides,
})

/** Nothing is printed while the tests run; the output has its own tests. */
const quiet = () => undefined

const run = () =>
  importPatterns({ sourceDir, catalogPath, outDir, log: quiet, warn: quiet })

const catalogText = () => readFile(catalogPath, 'utf8')

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'ptt-import-'))
  sourceDir = path.join(dir, 'Design Pattern')
  outDir = path.join(dir, 'community')
  catalogPath = path.join(dir, 'patterns.json')

  await mkdir(sourceDir, { recursive: true })
  await writeFile(catalogPath, CATALOG)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('importPatterns', () => {
  it('adds a pattern, its two files and its catalog entry', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons())

    const result = await run()

    expect(result.changes).toEqual([
      {
        id: 'lemons',
        status: 'added',
        imageChanged: false,
        detailsChanged: false,
      },
    ])
    expect(result.written).toHaveLength(2)
    expect(result.catalogChanged).toBe(true)

    const [entry] = communityItems(await catalogText())
    expect(entry).toMatchObject({
      id: 'lemons',
      kind: 'tile',
      recolorable: false,
      repeatUnits: 500,
      tags: ['community'],
      source: { type: 'community', credit: 'Designer TBC' },
    })

    // The file name carries a hash of the artwork, so a revision cannot be
    // served from a cache.
    expect((entry as { src: string }).src).toMatch(
      /^\/catalog\/patterns\/community\/lemons\.[0-9a-f]{8}\.webp$/,
    )
  })

  it('changes nothing at all when it is run again', async () => {
    await artwork('lemons.png', '#ffe066')
    await artwork('stars.png', '#c3c9f5')
    await manifest(lemons(), stars())
    await run()

    const text = await catalogText()
    const files = await readdir(outDir)

    const again = await run()

    expect(again.changes.map((change) => change.status)).toEqual([
      'unchanged',
      'unchanged',
    ])
    expect(again).toMatchObject({
      written: [],
      deleted: [],
      removed: [],
      catalogChanged: false,
    })
    expect(await catalogText()).toBe(text)
    expect(await readdir(outDir)).toEqual(files)
  })

  it('leaves the hand-written entries exactly as they were', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons())
    await run()

    expect(await catalogText()).toContain(PLACEHOLDER)
  })

  it('keeps the id but renames the files when the artwork is revised', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons())
    await run()

    const before = communityItems(await catalogText())[0] as { src: string }

    // The designer re-exports the same pattern, in a different colour.
    await artwork('lemons.png', '#ffd43b')
    const result = await run()

    const after = communityItems(await catalogText())[0] as {
      id: string
      src: string
    }

    expect(result.changes[0]).toMatchObject({
      id: 'lemons',
      status: 'updated',
      imageChanged: true,
      // Only the picture: the manifest said the same things about it.
      detailsChanged: false,
    })
    expect(after.id).toBe('lemons')
    expect(after.src).not.toBe(before.src)

    // The old pair is gone and the new pair is there: two files, not four.
    expect(await readdir(outDir)).toHaveLength(2)
    expect(result.deleted).toHaveLength(2)
  })

  it('follows a file being renamed, as long as the id stays', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons())
    await run()

    await artwork('Untitled_Artwork 2.png', '#ffe066')
    await manifest(lemons({ file: 'Untitled_Artwork 2.png' }))
    const result = await run()

    expect(result.changes[0]?.status).toBe('unchanged')
    expect(result.written).toEqual([])
  })

  it('rewrites the entry alone when only the manifest changed', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons())
    await run()

    await manifest(lemons({ name: { th: 'ลายมะนาว', en: 'Lemon slices' } }))
    const result = await run()

    expect(result.changes[0]).toMatchObject({
      status: 'updated',
      imageChanged: false,
      detailsChanged: true,
    })
    // The picture is the same picture, so nothing was converted or deleted.
    expect(result).toMatchObject({ written: [], deleted: [] })
    expect(await catalogText()).toContain('Lemon slices')
  })

  it('removes a pattern the manifest has dropped, files and all', async () => {
    await artwork('lemons.png', '#ffe066')
    await artwork('stars.png', '#c3c9f5')
    await manifest(lemons(), stars())
    await run()

    const warnings: string[] = []
    const result = await importPatterns({
      sourceDir,
      catalogPath,
      outDir,
      log: quiet,
      warn: (line) => warnings.push(line),
    })

    expect(result.removed).toEqual([])

    await manifest(lemons())
    const dropped = await importPatterns({
      sourceDir,
      catalogPath,
      outDir,
      log: quiet,
      warn: (line) => warnings.push(line),
    })

    expect(dropped.removed).toEqual(['stars'])
    expect(dropped.deleted).toHaveLength(2)
    expect(communityItems(await catalogText())).toHaveLength(1)

    // Saying so matters: a design that used it loses that layer.
    expect(warnings.join('\n')).toContain('loses that layer')
  })

  it('names the entry when its file is not in the folder', async () => {
    await manifest(lemons({ file: 'nowhere.png' }))

    await expect(run()).rejects.toThrow('entry "lemons"')
  })

  it('refuses a manifest two entries share an id in', async () => {
    await artwork('lemons.png', '#ffe066')
    await manifest(lemons(), lemons({ file: 'lemons.png' }))

    await expect(run()).rejects.toThrow('already used')
  })
})
