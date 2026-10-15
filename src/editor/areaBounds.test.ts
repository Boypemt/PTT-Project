import { beforeEach, describe, expect, it } from 'vitest'
import { areaBounds, resetAreaBounds } from './areaBounds'

/** The leaf plate's round face, as products.json draws it. */
const CIRCLE = 'M200 500A300 300 0 1 1 800 500A300 300 0 1 1 200 500Z'

/** The wrap cloth: a diamond with curved sides, drawn with béziers. */
const DIAMOND =
  'M500 150C616 226 774 384 850 500C774 616 616 774 500 850C384 774 226 616 150 500C226 384 384 226 500 150Z'

beforeEach(() => {
  resetAreaBounds()
})

describe('areaBounds', () => {
  it('is a rectangle clip as it stands', () => {
    expect(
      areaBounds({ type: 'rect', x: 556, y: 556, width: 234, height: 234 }),
    ).toEqual({ x: 556, y: 556, width: 234, height: 234 })
  })

  it('measures a path drawn with arcs', () => {
    expect(areaBounds({ type: 'path', d: CIRCLE })).toEqual({
      x: 200,
      y: 200,
      width: 600,
      height: 600,
    })
  })

  it('measures a path drawn with curves', () => {
    expect(areaBounds({ type: 'path', d: DIAMOND })).toEqual({
      x: 150,
      y: 150,
      width: 700,
      height: 700,
    })
  })

  it('answers with the same box the second time, from the cache', () => {
    const first = areaBounds({ type: 'path', d: CIRCLE })
    const second = areaBounds({ type: 'path', d: CIRCLE })

    expect(second).toEqual(first)
  })

  it('has no box for a path it cannot read, rather than NaN', () => {
    expect(areaBounds({ type: 'path', d: '' })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })
})
