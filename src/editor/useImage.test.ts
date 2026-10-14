/**
 * The cache is the point of this hook, so that is what these check: one
 * element per URL however many components ask, and a load or an error
 * reaching every one of them.
 *
 * jsdom never fetches, so the tests settle the element themselves by firing
 * the events the browser would.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { resetImageCache, useImage } from './useImage'

const BASE = '/catalog/products/shawl-cotton-base.svg'
const OVERLAY = '/catalog/products/shawl-cotton-overlay.svg'

const fire = (image: HTMLImageElement, type: 'load' | 'error') => {
  act(() => {
    image.dispatchEvent(new Event(type))
  })
}

afterEach(() => {
  resetImageCache()
})

describe('useImage', () => {
  it('starts loading and points at an element for the URL', () => {
    const { result } = renderHook(() => useImage(BASE))

    expect(result.current.status).toBe('loading')
    expect(result.current.image.src).toContain(BASE)
  })

  it('hands the same element to every caller of one URL', () => {
    const first = renderHook(() => useImage(BASE))
    const second = renderHook(() => useImage(BASE))

    expect(second.result.current.image).toBe(first.result.current.image)
  })

  it('gives different URLs their own element', () => {
    const base = renderHook(() => useImage(BASE))
    const overlay = renderHook(() => useImage(OVERLAY))

    expect(overlay.result.current.image).not.toBe(base.result.current.image)
  })

  it('reports a load to every caller', () => {
    const first = renderHook(() => useImage(BASE))
    const second = renderHook(() => useImage(BASE))

    fire(first.result.current.image, 'load')

    expect(first.result.current.status).toBe('loaded')
    expect(second.result.current.status).toBe('loaded')
  })

  it('reports an already loaded URL on the first render', () => {
    const first = renderHook(() => useImage(BASE))
    fire(first.result.current.image, 'load')

    const later = renderHook(() => useImage(BASE))

    expect(later.result.current.status).toBe('loaded')
  })

  it('reports a failed load as an error rather than loading forever', () => {
    const { result } = renderHook(() => useImage(BASE))

    fire(result.current.image, 'error')

    expect(result.current.status).toBe('error')
  })

  it('follows a changed URL', () => {
    const { result, rerender } = renderHook(({ src }) => useImage(src), {
      initialProps: { src: BASE },
    })
    const base = result.current.image

    rerender({ src: OVERLAY })

    expect(result.current.image).not.toBe(base)
    expect(result.current.image.src).toContain(OVERLAY)
  })
})
