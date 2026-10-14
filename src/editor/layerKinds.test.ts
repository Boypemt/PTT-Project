/**
 * The gate that keeps the editor honest about what it can place. When task 09
 * adds `'motif'` to `SUPPORTED_LAYER_KINDS`, the expectations here are the
 * list of things that change.
 */
import { describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makeProduct } from '@/test/catalogFixtures'
import {
  SUPPORTED_LAYER_KINDS,
  isSupportedKind,
  targetPrintArea,
  usableKinds,
  usablePrintAreas,
} from './layerKinds'

const area = (
  id: string,
  allowedKinds: PrintArea['allowedKinds'],
): PrintArea => ({
  id,
  name: { th: `TH ${id}`, en: id },
  clip: { type: 'rect', x: 0, y: 0, width: 100, height: 100 },
  allowedKinds,
})

const cloth = area('cloth', ['tile', 'motif'])
const sleeves = area('sleeves', ['tile'])
const corner = area('corner', ['motif'])

const product = makeProduct({ printAreas: [cloth, corner, sleeves] })

describe('supported layer kinds', () => {
  it('places tiles and not motifs yet', () => {
    expect(SUPPORTED_LAYER_KINDS).toEqual(['tile'])
    expect(isSupportedKind('tile')).toBe(true)
    expect(isSupportedKind('motif')).toBe(false)
  })

  it('narrows an area to the kinds it accepts and the editor can place', () => {
    expect(usableKinds(cloth)).toEqual(['tile'])
    expect(usableKinds(sleeves)).toEqual(['tile'])
    expect(usableKinds(corner)).toEqual([])
  })
})

describe('usablePrintAreas', () => {
  it('leaves out an area nothing can be put on yet', () => {
    expect(usablePrintAreas(product).map((entry) => entry.id)).toEqual([
      'cloth',
      'sleeves',
    ])
  })

  it('keeps the catalog order, so the product decides which comes first', () => {
    const reversed = makeProduct({ printAreas: [sleeves, cloth] })

    expect(usablePrintAreas(reversed).map((entry) => entry.id)).toEqual([
      'sleeves',
      'cloth',
    ])
  })

  it('can come back empty for a product that is all motif areas', () => {
    expect(usablePrintAreas(makeProduct({ printAreas: [corner] }))).toEqual([])
  })
})

describe('targetPrintArea', () => {
  it('is the area the visitor selected', () => {
    expect(targetPrintArea(product, 'sleeves')?.id).toBe('sleeves')
  })

  it('falls back to the first usable area when nothing is selected', () => {
    expect(targetPrintArea(product, null)?.id).toBe('cloth')
  })

  it('falls back when the selected area cannot be printed on yet', () => {
    expect(targetPrintArea(product, 'corner')?.id).toBe('cloth')
  })

  it('has nowhere to put a pattern on an all-motif product', () => {
    expect(
      targetPrintArea(makeProduct({ printAreas: [corner] }), 'corner'),
    ).toBeUndefined()
  })
})
