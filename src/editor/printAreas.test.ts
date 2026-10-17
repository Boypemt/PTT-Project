/**
 * Which print area a tap prints on — the answer the library and the print-area
 * chips both read, so that what the chips light up is where the pattern goes.
 */
import { describe, expect, it } from 'vitest'
import type { PrintArea } from '@/catalog'
import { makeProduct } from '@/test/catalogFixtures'
import { targetPrintArea } from './printAreas'

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

describe('targetPrintArea', () => {
  it('is the area the visitor selected', () => {
    expect(targetPrintArea(product, 'sleeves')?.id).toBe('sleeves')
  })

  it('is a motif-only area as readily as any other', () => {
    expect(targetPrintArea(product, 'corner')?.id).toBe('corner')
  })

  it('falls back to the first area when nothing is selected', () => {
    expect(targetPrintArea(product, null)?.id).toBe('cloth')
  })

  it('falls back when the selection names no area of this product', () => {
    expect(targetPrintArea(product, 'collar')?.id).toBe('cloth')
  })

  it('keeps the catalog order, so the product decides which comes first', () => {
    const reversed = makeProduct({ printAreas: [sleeves, cloth] })

    expect(targetPrintArea(reversed, null)?.id).toBe('sleeves')
  })

  it('has nowhere to print on a product with no print area', () => {
    expect(
      targetPrintArea(makeProduct({ printAreas: [] }), null),
    ).toBeUndefined()
  })
})
