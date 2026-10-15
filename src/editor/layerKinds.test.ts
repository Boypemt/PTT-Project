/**
 * The gate that keeps the editor honest about what it can place — and, with
 * the `motifs` flag, the gate the whole feature comes through. The two
 * `describe`s below are the same questions asked of a build without the flag
 * and a build with it, which is what the app has to do in both states.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makeProduct } from '@/test/catalogFixtures'
import {
  isSupportedKind,
  supportedLayerKinds,
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

/** Switches the flag on for one test, as a build made with it would be. */
const withMotifs = () => {
  vi.stubEnv('VITE_FLAGS', 'motifs')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('with the motifs flag off', () => {
  it('places tiles and not motifs', () => {
    expect(supportedLayerKinds()).toEqual(['tile'])
    expect(isSupportedKind('tile')).toBe(true)
    expect(isSupportedKind('motif')).toBe(false)
  })

  it('narrows an area to the kinds it accepts and the editor can place', () => {
    expect(usableKinds(cloth)).toEqual(['tile'])
    expect(usableKinds(sleeves)).toEqual(['tile'])
    expect(usableKinds(corner)).toEqual([])
  })

  it('leaves out an area nothing can be put on', () => {
    expect(usablePrintAreas(product).map((entry) => entry.id)).toEqual([
      'cloth',
      'sleeves',
    ])
  })

  it('can come back empty for a product that is all motif areas', () => {
    expect(usablePrintAreas(makeProduct({ printAreas: [corner] }))).toEqual([])
  })

  it('has nowhere to put a pattern on an all-motif product', () => {
    expect(
      targetPrintArea(makeProduct({ printAreas: [corner] }), 'corner'),
    ).toBeUndefined()
  })

  it('falls back when the selected area cannot be printed on', () => {
    expect(targetPrintArea(product, 'corner')?.id).toBe('cloth')
  })
})

describe('with the motifs flag on', () => {
  it('places both kinds', () => {
    withMotifs()

    expect(supportedLayerKinds()).toEqual(['tile', 'motif'])
    expect(isSupportedKind('motif')).toBe(true)
  })

  it('keeps the kinds an area allows, in the area own order', () => {
    withMotifs()

    expect(usableKinds(cloth)).toEqual(['tile', 'motif'])
    expect(usableKinds(sleeves)).toEqual(['tile'])
    expect(usableKinds(corner)).toEqual(['motif'])
  })

  it('offers the motif-only areas as well', () => {
    withMotifs()

    expect(usablePrintAreas(product).map((entry) => entry.id)).toEqual([
      'cloth',
      'corner',
      'sleeves',
    ])
  })

  it('leaves a motif-only product with somewhere to print', () => {
    withMotifs()
    const handkerchief = makeProduct({ printAreas: [corner] })

    expect(usablePrintAreas(handkerchief).map((entry) => entry.id)).toEqual([
      'corner',
    ])
    expect(targetPrintArea(handkerchief, 'corner')?.id).toBe('corner')
  })

  it('stays on a motif area the visitor selected', () => {
    withMotifs()

    expect(targetPrintArea(product, 'corner')?.id).toBe('corner')
  })
})

describe('usablePrintAreas', () => {
  it('keeps the catalog order, so the product decides which comes first', () => {
    const reversed = makeProduct({ printAreas: [sleeves, cloth] })

    expect(usablePrintAreas(reversed).map((entry) => entry.id)).toEqual([
      'sleeves',
      'cloth',
    ])
  })
})

describe('targetPrintArea', () => {
  it('is the area the visitor selected', () => {
    expect(targetPrintArea(product, 'sleeves')?.id).toBe('sleeves')
  })

  it('falls back to the first usable area when nothing is selected', () => {
    expect(targetPrintArea(product, null)?.id).toBe('cloth')
  })
})
