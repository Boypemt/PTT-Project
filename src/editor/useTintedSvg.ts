/**
 * A pattern's SVG with a design's colours in it, as a URL an image can load.
 *
 * The file is fetched once as text and kept; everything after that is string
 * work (see `src/lib/svgColor.ts`) and happens in the same tick. That split is
 * what makes the leaf-dye swatches feel like swatches: the first colour put on
 * a pattern waits for the file, and every colour after it is ready the moment
 * it is asked for, with no round trip to flash through.
 *
 * A design with no colours, or a fetch that fails — an offline preview, a file
 * the designer has not added yet — reports no URL at all, and the caller falls
 * back to loading the pattern as it is on disk, in the defaults written into
 * it. A tile in the wrong colours beats a tile that is not there.
 */
import { useCallback, useSyncExternalStore } from 'react'
import { recolorSvg, svgDataUrl } from '@/lib/svgColor'

export type TintedSvg = {
  /** The recoloured file, or `undefined` while loading, or where it failed. */
  url: string | undefined
}

type TextEntry = {
  text: string | undefined
  listeners: Set<() => void>
}

/** The source text per pattern URL. */
const texts = new Map<string, TextEntry>()

/** The finished data URL per pattern URL and colour list. */
const tinted = new Map<string, TintedSvg>()

/** Nothing to tint with: one shared answer, so the hook stays stable. */
const UNTINTED: TintedSvg = { url: undefined }

export function resetTintedSvgs(): void {
  texts.clear()
  tinted.clear()
}

function textEntry(src: string): TextEntry {
  const cached = texts.get(src)
  if (cached !== undefined) return cached

  const entry: TextEntry = { text: undefined, listeners: new Set() }
  texts.set(src, entry)

  const settle = (text: string | undefined) => {
    entry.text = text
    for (const listener of entry.listeners) listener()
  }

  fetch(src)
    .then(async (response) => (response.ok ? response.text() : undefined))
    .then(settle)
    // A pattern that cannot be read stays untinted rather than disappearing,
    // so this is the end of it rather than something to report.
    .catch(() => {
      settle(undefined)
    })

  return entry
}

function snapshot(src: string, colors: readonly string[]): TintedSvg {
  if (colors.length === 0) return UNTINTED

  const key = `${src}|${colors.join(',')}`
  const cached = tinted.get(key)
  if (cached !== undefined) return cached

  const { text } = textEntry(src)

  // Not cached while the text is missing: the fetch may still land, and a
  // remembered "nothing" would outlive it.
  if (text === undefined) return UNTINTED

  const answer: TintedSvg = { url: svgDataUrl(recolorSvg(text, colors)) }
  tinted.set(key, answer)

  return answer
}

export function useTintedSvg(
  src: string,
  colors: readonly string[],
): TintedSvg {
  // The colours are a new array on every render, so the hook depends on their
  // text rather than on their identity.
  const key = colors.join(',')

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (key === '') return () => undefined

      const entry = textEntry(src)
      entry.listeners.add(onChange)

      return () => {
        entry.listeners.delete(onChange)
      }
    },
    [src, key],
  )

  const read = useCallback(
    () => snapshot(src, key === '' ? [] : key.split(',')),
    [src, key],
  )

  return useSyncExternalStore(subscribe, read)
}
