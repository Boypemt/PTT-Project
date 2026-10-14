/**
 * Loads an image once per URL and shares it with everyone who asks.
 *
 * Konva draws from an `HTMLImageElement`, so every mockup, tile and motif has
 * to be decoded before it can appear on the stage. Without a cache the editor
 * would build a new element on each mount — a fresh decode of the same file on
 * every base-colour change, and a flash of nothing in between. The cache is
 * module-level and never evicted: the catalog is a few dozen small SVGs, and
 * the browser would keep them in its own memory cache anyway.
 *
 * `image` is the element whether or not it has loaded yet; draw it only once
 * `status` is `loaded`, because an undecoded element paints nothing and a
 * broken one makes Konva throw.
 */
import { useCallback, useSyncExternalStore } from 'react'

export type ImageStatus = 'loading' | 'loaded' | 'error'

export type LoadedImage = {
  status: ImageStatus
  /** The shared element for this URL. Only paint it when `status` is `loaded`. */
  image: HTMLImageElement
}

type Entry = {
  snapshot: LoadedImage
  listeners: Set<() => void>
}

const cache = new Map<string, Entry>()

function entryFor(src: string): Entry {
  const cached = cache.get(src)
  if (cached !== undefined) return cached

  const image = new Image()
  const entry: Entry = {
    snapshot: { status: 'loading', image },
    listeners: new Set(),
  }
  cache.set(src, entry)

  const settle = (status: ImageStatus) => {
    entry.snapshot = { status, image }
    for (const listener of entry.listeners) listener()
  }

  image.addEventListener('load', () => {
    settle('loaded')
  })
  image.addEventListener('error', () => {
    settle('error')
  })
  // Last, so a browser answering from its own cache cannot settle the entry
  // before the listeners are attached.
  image.src = src

  return entry
}

/**
 * Drops every cached element.
 *
 * For tests only — one test's fake `load` event must not decide what the next
 * one sees.
 */
export function resetImageCache(): void {
  cache.clear()
}

export function useImage(src: string): LoadedImage {
  // Both callbacks look the entry up again rather than closing over one, so a
  // changed `src` cannot leave the hook reading the previous URL's snapshot.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const entry = entryFor(src)
      entry.listeners.add(onChange)

      return () => {
        entry.listeners.delete(onChange)
      }
    },
    [src],
  )

  const snapshot = useCallback(() => entryFor(src).snapshot, [src])

  return useSyncExternalStore(subscribe, snapshot)
}
