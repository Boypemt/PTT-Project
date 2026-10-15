import { describe, expect, it } from 'vitest'
import { createRandom } from './random'

/** The first few values of a sequence, which is what a seed is judged on. */
const sequence = (seed: number, count = 8) => {
  const random = createRandom(seed)

  return Array.from({ length: count }, () => random.next())
}

describe('createRandom', () => {
  it('walks the same sequence for the same seed', () => {
    expect(sequence(1234)).toEqual(sequence(1234))
  })

  it('walks a different one for a different seed', () => {
    expect(sequence(1234)).not.toEqual(sequence(1235))
  })

  it('keeps two generators out of each other way', () => {
    const first = createRandom(7)
    const second = createRandom(7)

    first.next()
    first.next()

    expect(second.next()).toBe(sequence(7, 1)[0])
  })

  it('stays in [0, 1)', () => {
    const random = createRandom(99)

    for (let i = 0; i < 500; i += 1) {
      const value = random.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('spreads across the range rather than hugging one end', () => {
    const random = createRandom(2026)
    const halves = [0, 0]

    for (let i = 0; i < 1000; i += 1) {
      halves[random.next() < 0.5 ? 0 : 1] += 1
    }

    // A fair coin lands this far from even about never; a sequence stuck in
    // one half of the range would scatter every leaf into the same corner.
    expect(halves[0]).toBeGreaterThan(400)
    expect(halves[1]).toBeGreaterThan(400)
  })

  it('takes a seed of 0, a fraction or a timestamp', () => {
    for (const seed of [0, 0.5, -3, Date.now()]) {
      const value = createRandom(seed).next()
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('is not thrown by a seed that is not a number', () => {
    expect(sequence(Number.NaN)).toEqual(sequence(Number.NaN))
  })
})

describe('between', () => {
  it('stays inside the range', () => {
    const random = createRandom(5)

    for (let i = 0; i < 200; i += 1) {
      const value = random.between(100, 140)
      expect(value).toBeGreaterThanOrEqual(100)
      expect(value).toBeLessThan(140)
    }
  })

  it('answers with the lower end for an empty or backwards range', () => {
    const random = createRandom(5)

    expect(random.between(120, 120)).toBe(120)
    expect(random.between(140, 100)).toBe(140)
  })
})

describe('int', () => {
  it('includes both ends', () => {
    const random = createRandom(11)
    const seen = new Set<number>()

    for (let i = 0; i < 200; i += 1) seen.add(random.int(5, 8))

    expect([...seen].sort()).toEqual([5, 6, 7, 8])
  })

  it('is the number itself when both ends are the same', () => {
    expect(createRandom(3).int(6, 6)).toBe(6)
  })

  it('takes its ends in either order', () => {
    const random = createRandom(4)

    for (let i = 0; i < 50; i += 1) {
      const value = random.int(8, 5)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThanOrEqual(8)
    }
  })
})

describe('pick', () => {
  it('only ever picks something from the list', () => {
    const random = createRandom(42)
    const leaves = ['teak', 'mango', 'pheka']

    for (let i = 0; i < 100; i += 1) {
      expect(leaves).toContain(random.pick(leaves))
    }
  })

  it('reaches every entry', () => {
    const random = createRandom(8)
    const leaves = ['teak', 'mango', 'pheka']
    const seen = new Set(Array.from({ length: 200 }, () => random.pick(leaves)))

    expect(seen.size).toBe(leaves.length)
  })

  it('says so when there is nothing to pick from', () => {
    expect(() => createRandom(1).pick([])).toThrow(/something to pick from/)
  })
})
