/**
 * jsdom has neither a canvas context nor `Path2D`, so both stand in here: the
 * context as a plain object recording what was asked of it, `Path2D` as a
 * class remembering the string it was built from.
 */
import { describe, expect, it, vi } from 'vitest'
import { clipFunc, type ClipContext } from './clip'

class FakePath2D {
  d: string

  constructor(d: string) {
    this.d = d
  }
}

vi.stubGlobal('Path2D', FakePath2D)

const recordingContext = () => {
  const rects: number[][] = []
  const ctx: ClipContext = {
    rect: (x, y, width, height) => rects.push([x, y, width, height]),
  }

  return { ctx, rects }
}

describe('a rectangular print area', () => {
  const clip = {
    type: 'rect',
    x: 170,
    y: 268,
    width: 660,
    height: 464,
  } as const

  it('puts the rectangle on the path in mockup coordinates', () => {
    const { ctx, rects } = recordingContext()

    clipFunc(clip)(ctx)

    expect(rects).toEqual([[170, 268, 660, 464]])
  })

  it('returns nothing, so Konva clips to the path it just built', () => {
    const { ctx } = recordingContext()

    expect(clipFunc(clip)(ctx)).toBeUndefined()
  })
})

describe('a path print area', () => {
  const d = 'M200 500A300 300 0 1 1 800 500A300 300 0 1 1 200 500Z'
  const clip = { type: 'path', d } as const

  it('clips to a Path2D built from the SVG d string', () => {
    const { ctx } = recordingContext()

    const [path] = clipFunc(clip)(ctx) ?? []

    expect(path).toBeInstanceOf(FakePath2D)
    expect(path).toMatchObject({ d })
  })

  it('draws no rectangle', () => {
    const { ctx, rects } = recordingContext()

    clipFunc(clip)(ctx)

    expect(rects).toEqual([])
  })

  it('parses the path once however often it is drawn', () => {
    const { ctx } = recordingContext()
    const func = clipFunc(clip)

    expect(func(ctx)?.[0]).toBe(func(ctx)?.[0])
  })
})
