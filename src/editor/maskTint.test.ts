/**
 * What a browser would paint, recorded.
 *
 * jsdom has no 2D context, so the composite itself has to be stubbed — but the
 * *order* of what it is asked to do is the whole of the technique: draw the
 * stencil, switch to `source-in`, then flood. Get that order wrong and the
 * colour covers the pattern instead of filling it, which is a bug no type
 * catches and a screenshot shows only once the baselines have moved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetMaskTints, tintedMask } from './maskTint'

const TINT_URL = 'data:image/png;base64,tinted'

type Step = string

/** A canvas whose context writes down every step it is put through. */
function stubCanvas(): Step[] {
  const steps: Step[] = []

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      const context = {
        drawImage: () => {
          steps.push('draw')
        },
        fillRect: (x: number, y: number, width: number, height: number) => {
          steps.push(
            `fill ${String(width)}x${String(height)} at ${String(x)},${String(y)}` +
              ` ${String(context.globalCompositeOperation)} ${String(context.fillStyle)}`,
          )
        },
        globalCompositeOperation: 'source-over',
        fillStyle: '',
      }

      return context as unknown as CanvasRenderingContext2D
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(TINT_URL)

  return steps
}

/** A decoded stencil of the given size. */
function mask(size = 1600): HTMLImageElement {
  const image = new Image()

  for (const prop of ['naturalWidth', 'naturalHeight']) {
    Object.defineProperty(image, prop, { value: size, configurable: true })
  }

  return image
}

afterEach(() => {
  vi.restoreAllMocks()
  resetMaskTints()
})

describe('tintedMask', () => {
  it('floods the colour through the ink and nowhere else', () => {
    const steps = stubCanvas()

    expect(tintedMask('key', mask(), '#4B2A4F')).toBe(TINT_URL)
    expect(steps).toEqual(['draw', 'fill 1600x1600 at 0,0 source-in #4B2A4F'])
  })

  it('paints one mask in one colour once', () => {
    const steps = stubCanvas()
    const image = mask()

    tintedMask('key', image, '#4B2A4F')
    tintedMask('key', image, '#4B2A4F')

    expect(steps).toHaveLength(2)
  })

  it('reports nothing where there is no canvas to paint on', () => {
    // jsdom as it comes: `getContext` answers null, and the caller draws the
    // stencil as imported rather than nothing at all.
    expect(tintedMask('key', mask(), '#4B2A4F')).toBeNull()
  })

  it('reports nothing for a stencil that decoded to no size', () => {
    stubCanvas()

    expect(tintedMask('key', mask(0), '#4B2A4F')).toBeNull()
  })
})
