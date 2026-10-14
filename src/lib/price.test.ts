import { describe, expect, it } from 'vitest'
import type { Price } from '@/catalog'
import { formatAmount, formatPrice } from './price'

const thb = (min: number, max?: number): Price => ({
  min,
  ...(max === undefined ? {} : { max }),
  currency: 'THB',
})

const COMING_SOON = 'Price coming soon'

describe('formatAmount', () => {
  it('leaves a short number alone', () => {
    expect(formatAmount(259)).toBe('259')
  })

  it('groups thousands', () => {
    expect(formatAmount(1490)).toBe('1,490')
    expect(formatAmount(12000)).toBe('12,000')
  })

  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0')
  })
})

describe('formatPrice', () => {
  it('writes a single price with the baht sign', () => {
    expect(formatPrice(thb(259), COMING_SOON)).toBe('฿259')
    expect(formatPrice(thb(18), COMING_SOON)).toBe('฿18')
  })

  it('writes a range with an en dash and one baht sign', () => {
    expect(formatPrice(thb(59, 89), COMING_SOON)).toBe('฿59–89')
  })

  it('groups thousands in both ends of a range', () => {
    expect(formatPrice(thb(1490), COMING_SOON)).toBe('฿1,490')
    expect(formatPrice(thb(1490, 2600), COMING_SOON)).toBe('฿1,490–2,600')
  })

  it('writes a max equal to min as a single price', () => {
    expect(formatPrice(thb(250, 250), COMING_SOON)).toBe('฿250')
  })

  it('falls back to the given wording when the price is not set yet', () => {
    expect(formatPrice(null, COMING_SOON)).toBe(COMING_SOON)
    expect(formatPrice(null, 'ราคาเร็วๆ นี้')).toBe('ราคาเร็วๆ นี้')
  })
})
