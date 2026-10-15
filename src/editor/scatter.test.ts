import { describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makePattern } from '@/test/catalogFixtures'
import { MOTIF_UNIT } from './motifBox'
import { motifSizeBounds } from './motifPlacement'
import { leafPatterns, SCATTER_COUNT, scatterMotifs } from './scatter'

const cloth: PrintArea = {
  id: 'cloth',
  name: { th: 'TH cloth', en: 'Whole cloth' },
  clip: { type: 'rect', x: 170, y: 268, width: 660, height: 464 },
  allowedKinds: ['tile', 'motif'],
}

const bounds = { x: 170, y: 268, width: 660, height: 464 }

const leaf = (id: string) =>
  makePattern({ id, kind: 'motif', leafIds: [id], defaultColors: ['#4B2A4F'] })

/** The catalog's own shape: tiles, leaves, and a motif that is not a leaf. */
const patterns = [
  makePattern({ id: 'gingham', kind: 'tile', leafIds: undefined }),
  makePattern({ id: 'eco-print-scatter', kind: 'tile', leafIds: ['teak'] }),
  leaf('teak'),
  leaf('mango'),
  leaf('pheka'),
  makePattern({ id: 'tong-tung', kind: 'motif', leafIds: undefined }),
  makePattern({ id: 'hollow', kind: 'motif', leafIds: [] }),
]

describe('leafPatterns', () => {
  it('is the motifs that name the leaves they are made from', () => {
    expect(leafPatterns(patterns).map((entry) => entry.id)).toEqual([
      'teak',
      'mango',
      'pheka',
    ])
  })

  it('leaves out a tile, even one made of leaves', () => {
    expect(leafPatterns(patterns).map((entry) => entry.id)).not.toContain(
      'eco-print-scatter',
    )
  })

  it('is empty for a catalog with no leaves in it', () => {
    expect(leafPatterns([patterns[0]])).toEqual([])
  })
})

describe('scatterMotifs', () => {
  it('throws the same leaves for the same seed', () => {
    expect(scatterMotifs(patterns, cloth, 7)).toEqual(
      scatterMotifs(patterns, cloth, 7),
    )
  })

  it('throws different ones for a different seed', () => {
    expect(scatterMotifs(patterns, cloth, 7)).not.toEqual(
      scatterMotifs(patterns, cloth, 8),
    )
  })

  it('throws between five and eight of them', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const thrown = scatterMotifs(patterns, cloth, seed)

      expect(thrown.length).toBeGreaterThanOrEqual(SCATTER_COUNT.min)
      expect(thrown.length).toBeLessThanOrEqual(SCATTER_COUNT.max)
    }
  })

  it('reaches both ends of that count over many seeds', () => {
    const counts = new Set(
      Array.from(
        { length: 200 },
        (_, seed) => scatterMotifs(patterns, cloth, seed).length,
      ),
    )

    expect(counts).toContain(SCATTER_COUNT.min)
    expect(counts).toContain(SCATTER_COUNT.max)
  })

  it('lays every leaf inside the print area, on the area it was asked for', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      for (const motif of scatterMotifs(patterns, cloth, seed)) {
        expect(motif.printAreaId).toBe(cloth.id)
        expect(motif.x).toBeGreaterThanOrEqual(bounds.x)
        expect(motif.x).toBeLessThanOrEqual(bounds.x + bounds.width)
        expect(motif.y).toBeGreaterThanOrEqual(bounds.y)
        expect(motif.y).toBeLessThanOrEqual(bounds.y + bounds.height)
      }
    }
  })

  it('sizes them within the range a single tap uses', () => {
    const sizes = motifSizeBounds(bounds)

    for (let seed = 0; seed < 30; seed += 1) {
      for (const motif of scatterMotifs(patterns, cloth, seed)) {
        const size = motif.scale * MOTIF_UNIT

        expect(size).toBeGreaterThanOrEqual(sizes.min)
        expect(size).toBeLessThanOrEqual(sizes.max)
      }
    }
  })

  it('turns them every which way, which is the point of a scatter', () => {
    const thrown = scatterMotifs(patterns, cloth, 3)
    const angles = thrown.map((motif) => motif.rotation)

    for (const angle of angles) {
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    }
    expect(new Set(angles).size).toBeGreaterThan(1)
  })

  it('uses only leaves, and more than one of them', () => {
    const ids = scatterMotifs(patterns, cloth, 11).map(
      (motif) => motif.patternId,
    )

    for (const id of ids) expect(['teak', 'mango', 'pheka']).toContain(id)
    expect(new Set(ids).size).toBeGreaterThan(1)
  })

  it('does not share a pattern colours array', () => {
    const [first] = scatterMotifs(patterns, cloth, 2)

    first.colors.push('#000000')
    expect(patterns[2].defaultColors).toEqual(['#4B2A4F'])
  })

  it('throws nothing when the catalog has no leaves', () => {
    expect(scatterMotifs([patterns[0]], cloth, 1)).toEqual([])
  })

  it('works on an area drawn as a path', () => {
    const plate: PrintArea = {
      ...cloth,
      id: 'centre',
      clip: {
        type: 'path',
        d: 'M330 500A170 170 0 1 1 670 500A170 170 0 1 1 330 500Z',
      },
    }

    for (const motif of scatterMotifs(patterns, plate, 5)) {
      expect(motif.x).toBeGreaterThanOrEqual(330)
      expect(motif.x).toBeLessThanOrEqual(670)
      expect(motif.y).toBeGreaterThanOrEqual(330)
      expect(motif.y).toBeLessThanOrEqual(670)
    }
  })
})
