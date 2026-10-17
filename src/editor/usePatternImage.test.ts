/**
 * Two paths matter here: a browser that can rasterise, and one that cannot.
 *
 * jsdom is the second — `getContext('2d')` returns null — so the fallback is
 * tested as it comes, and the raster path gets a stub canvas whose context
 * records what was drawn. The stub is what a browser would do, which is also
 * why the numbers are asserted: the size of the bitmap and the `ratio`
 * reported with it are what keeps a tile the right size on screen.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetImageCache } from './useImage'
import {
  RASTER_SCALE,
  resetPatternRasters,
  usePatternImage,
} from './usePatternImage'

const SEIGAIHA = '/catalog/patterns/seigaiha.svg'
const GINGHAM = '/catalog/patterns/gingham.svg'

/** A photographed pattern: a bitmap already, with nothing in it to tint. */
const LEMONS = '/catalog/patterns/community/lemons.webp'

const RASTER_URL = 'data:image/png;base64,rastered'

/** The natural size of the SVG, which jsdom does not decode for itself. */
const NATURAL = 200

const fire = (image: HTMLImageElement, type: 'load' | 'error') => {
  act(() => {
    image.dispatchEvent(new Event(type))
  })
}

/** Reports the natural size a browser would have read out of the SVG. */
function sized(image: HTMLImageElement, size = NATURAL) {
  for (const prop of ['naturalWidth', 'naturalHeight']) {
    Object.defineProperty(image, prop, { value: size, configurable: true })
  }
}

type DrawCall = { width: number; height: number }

/** Makes canvases that record their draws, as a browser's would paint them. */
function stubCanvas(): DrawCall[] {
  const draws: DrawCall[] = []

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      return {
        drawImage: (
          _image: CanvasImageSource,
          _x: number,
          _y: number,
          width: number,
          height: number,
        ) => {
          draws.push({ width, height })
        },
      } as unknown as CanvasRenderingContext2D
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(RASTER_URL)

  return draws
}

afterEach(() => {
  vi.restoreAllMocks()
  resetPatternRasters()
  resetImageCache()
})

describe('usePatternImage', () => {
  it('waits for the SVG before there is anything to rasterise', () => {
    const { result } = renderHook(() => usePatternImage(SEIGAIHA))

    expect(result.current.status).toBe('loading')
    expect(result.current.image.src).toContain(SEIGAIHA)
  })

  it('reports a failed SVG as an error rather than rasterising nothing', () => {
    const { result } = renderHook(() => usePatternImage(SEIGAIHA))

    fire(result.current.image, 'error')

    expect(result.current.status).toBe('error')
  })

  it('draws the tile larger than life and says by how much', () => {
    const draws = stubCanvas()
    const { result } = renderHook(() => usePatternImage(SEIGAIHA))

    sized(result.current.image)
    fire(result.current.image, 'load')

    expect(draws).toEqual([
      { width: NATURAL * RASTER_SCALE, height: NATURAL * RASTER_SCALE },
    ])
    expect(result.current.ratio).toBe(RASTER_SCALE)
    expect(result.current.image.src).toBe(RASTER_URL)

    // The raster is an image like any other: it is loaded, not assumed.
    expect(result.current.status).toBe('loading')
    fire(result.current.image, 'load')
    expect(result.current.status).toBe('loaded')
  })

  it('rasterises one pattern once, however many layers ask for it', () => {
    const draws = stubCanvas()
    const first = renderHook(() => usePatternImage(SEIGAIHA))

    sized(first.result.current.image)
    fire(first.result.current.image, 'load')

    const second = renderHook(() => usePatternImage(SEIGAIHA))

    expect(draws).toHaveLength(1)
    expect(second.result.current.image).toBe(first.result.current.image)
  })

  it('gives each pattern its own raster', () => {
    stubCanvas()
    const seigaiha = renderHook(() => usePatternImage(SEIGAIHA))
    const gingham = renderHook(() => usePatternImage(GINGHAM))

    expect(gingham.result.current.image).not.toBe(seigaiha.result.current.image)
  })

  it('falls back to the SVG itself where no canvas can be drawn on', () => {
    const { result } = renderHook(() => usePatternImage(SEIGAIHA))

    sized(result.current.image)
    fire(result.current.image, 'load')

    // jsdom has no 2D context, so this is the fallback without any stubbing.
    expect(result.current.status).toBe('loaded')
    expect(result.current.ratio).toBe(1)
    expect(result.current.image.src).toContain(SEIGAIHA)
  })

  it('loads a photographed pattern as it is, without rasterising it', () => {
    const draws = stubCanvas()
    const { result } = renderHook(() => usePatternImage(LEMONS, ['#4B2A4F']))

    sized(result.current.image, 1600)
    fire(result.current.image, 'load')

    // Nothing drawn, nothing re-encoded, and the WebP itself on the stage.
    expect(draws).toEqual([])
    expect(result.current.ratio).toBe(1)
    expect(result.current.status).toBe('loaded')
    expect(result.current.image.src).toContain(LEMONS)
  })

  it('falls back for an SVG that decodes to no size at all', () => {
    stubCanvas()
    const { result } = renderHook(() => usePatternImage(SEIGAIHA))

    sized(result.current.image, 0)
    fire(result.current.image, 'load')

    expect(result.current.ratio).toBe(1)
    expect(result.current.image.src).toContain(SEIGAIHA)
  })
})
