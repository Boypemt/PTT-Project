/**
 * The render order the canvas draws from: which clipped group a layer lands
 * in, and in what order the groups and the layers inside them come out.
 */
import { describe, expect, it } from 'vitest'
import type { Design, Layer, PrintArea } from '@/catalog'
import { localized, makeProduct } from '@/test/catalogFixtures'
import { buildScene } from './scene'

const area = (id: string): PrintArea => ({
  id,
  name: localized(id),
  clip: { type: 'rect', x: 0, y: 0, width: 100, height: 100 },
  allowedKinds: ['tile', 'motif'],
})

const product = makeProduct({ printAreas: [area('cloth'), area('corner')] })

const layer = (id: string, printAreaId: string): Layer => ({
  id,
  type: 'tile',
  patternId: 'seigaiha',
  printAreaId,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  colors: ['#4B2A4F'],
  opacity: 1,
})

const design = (layers: Layer[]): Design => ({
  version: 1,
  productId: product.id,
  baseColor: '#F3EADA',
  layers,
})

const ids = (layers: Layer[]) => layers.map((entry) => entry.id)

describe('buildScene', () => {
  it('gives every print area a group, even an empty one', () => {
    const scene = buildScene(product, design([]))

    expect(scene.areas.map(({ area: entry }) => entry.id)).toEqual([
      'cloth',
      'corner',
    ])
    expect(scene.areas.every(({ layers }) => layers.length === 0)).toBe(true)
  })

  it('puts each layer in the group for the area it prints on', () => {
    const scene = buildScene(
      product,
      design([layer('a', 'corner'), layer('b', 'cloth')]),
    )

    expect(ids(scene.areas[0].layers)).toEqual(['b'])
    expect(ids(scene.areas[1].layers)).toEqual(['a'])
  })

  it('keeps the design order inside a group', () => {
    const scene = buildScene(
      product,
      design([
        layer('first', 'cloth'),
        layer('other', 'corner'),
        layer('second', 'cloth'),
      ]),
    )

    expect(ids(scene.areas[0].layers)).toEqual(['first', 'second'])
  })

  it('draws the areas in the order the product lists them', () => {
    const reversed = makeProduct({
      printAreas: [area('corner'), area('cloth')],
    })

    const scene = buildScene(reversed, design([]))

    expect(scene.areas.map(({ area: entry }) => entry.id)).toEqual([
      'corner',
      'cloth',
    ])
  })

  it('drops a layer naming an area the product does not have', () => {
    const stray = layer('stray', 'sleeves')

    const scene = buildScene(product, design([stray, layer('kept', 'cloth')]))

    expect(scene.areas.flatMap(({ layers }) => ids(layers))).toEqual(['kept'])
    expect(ids(scene.orphans)).toEqual(['stray'])
  })
})
