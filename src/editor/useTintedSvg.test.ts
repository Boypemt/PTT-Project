/**
 * The fetch is the part worth pinning down: it happens once per pattern
 * however many colours are tried on it, and a file that cannot be read leaves
 * the caller with nothing rather than with an error to handle.
 */
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetTintedSvgs, useTintedSvg } from './useTintedSvg'

const SRC = '/catalog/patterns/seigaiha.svg'

const TILE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
  '<rect width="200" height="200" fill="var(--c1, #4b2a4f)" /></svg>'

const TEAK = '#4B2A4F'
const MARIGOLD = '#E8B923'

/** What the hook's URL says once it is unpacked again. */
/** Lets the fetch chain settle, whichever way it goes. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

const svgIn = (url: string | undefined) =>
  url === undefined ? '' : decodeURIComponent(url.split(',')[1])

let fetched: string[]

beforeEach(() => {
  fetched = []
  vi.stubGlobal('fetch', (input: string) => {
    fetched.push(input)

    return Promise.resolve(
      new Response(TILE, {
        status: 200,
        headers: { 'content-type': 'image/svg+xml' },
      }),
    )
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetTintedSvgs()
})

describe('useTintedSvg', () => {
  it('asks for nothing when the design names no colours', () => {
    const { result } = renderHook(() => useTintedSvg(SRC, []))

    expect(result.current.url).toBeUndefined()
    expect(fetched).toEqual([])
  })

  it('hands back the file with the colours in it', async () => {
    const { result } = renderHook(() => useTintedSvg(SRC, [TEAK]))

    // Nothing to show until the file is here; the caller draws the pattern as
    // it is on disk in the meantime.
    expect(result.current.url).toBeUndefined()

    await waitFor(() => {
      expect(result.current.url).toBeDefined()
    })

    expect(svgIn(result.current.url)).toContain(`--c1:${TEAK}`)
    expect(svgIn(result.current.url)).toContain('fill="var(--c1, #4b2a4f)"')
  })

  it('reads the file once however many colours are tried on it', async () => {
    const first = renderHook(({ colors }) => useTintedSvg(SRC, colors), {
      initialProps: { colors: [TEAK] },
    })
    await waitFor(() => {
      expect(first.result.current.url).toBeDefined()
    })

    first.rerender({ colors: [MARIGOLD] })

    // The second colourway needs no round trip: it is string work on text the
    // first one already paid for, so it is ready in the same render.
    expect(svgIn(first.result.current.url)).toContain(`--c1:${MARIGOLD}`)
    expect(fetched).toEqual([SRC])
  })

  it('gives the same URL back for the same colours', async () => {
    const { result, rerender } = renderHook(
      ({ colors }) => useTintedSvg(SRC, colors),
      { initialProps: { colors: [TEAK] } },
    )
    await waitFor(() => {
      expect(result.current.url).toBeDefined()
    })
    const first = result.current.url

    rerender({ colors: [MARIGOLD] })
    rerender({ colors: [TEAK] })

    expect(result.current.url).toBe(first)
  })

  it('leaves the pattern untinted when the file cannot be read', async () => {
    const offline = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', offline)
    const { result } = renderHook(() => useTintedSvg(SRC, [TEAK]))

    await waitFor(() => {
      expect(offline).toHaveBeenCalled()
    })
    await settled()

    expect(result.current.url).toBeUndefined()
  })

  it('leaves it untinted when the file is missing', async () => {
    const missing = vi.fn(() =>
      Promise.resolve(new Response('nope', { status: 404 })),
    )
    vi.stubGlobal('fetch', missing)
    const { result } = renderHook(() => useTintedSvg(SRC, [TEAK]))

    await waitFor(() => {
      expect(missing).toHaveBeenCalled()
    })
    await settled()

    expect(result.current.url).toBeUndefined()
  })
})
