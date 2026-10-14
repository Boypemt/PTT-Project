/**
 * Reports the live size of an element.
 *
 * The Konva stage needs its size in pixels — a canvas has no `width: 100%` —
 * so the editor measures the box the browser gave it and hands the numbers to
 * the stage. A `ResizeObserver` catches every reason that box can change:
 * the window, the phone rotating, the bottom sheet opening, a font landing.
 *
 * The ref is a callback rather than an object so the first measurement happens
 * as soon as the element exists, and React 19 cleans the observer up when the
 * element goes away.
 */
import { useCallback, useState } from 'react'
import type { Size } from '@/lib/geometry'

/** Before the first measurement. `fitContain` draws nothing at this size. */
const UNMEASURED: Size = { width: 0, height: 0 }

export function useMeasuredSize<T extends HTMLElement>(): [
  (node: T | null) => void,
  Size,
] {
  const [size, setSize] = useState<Size>(UNMEASURED)

  const ref = useCallback((node: T | null) => {
    if (node === null) {
      setSize(UNMEASURED)
      return
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect()

      // Same numbers, same object: a new one every observer callback would
      // re-render the stage on every scroll-driven relayout.
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, size]
}
