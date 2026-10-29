import { describe, expect, it } from 'vitest'
import { fitContain } from '@/lib/geometry'
import { exportGeometry, exportedSize, MAX_EXPORT_EDGE } from './stageExport'

/** The one square mockup every product in the catalog uses today. */
const SQUARE = { width: 1000, height: 1000 }

/** A mockup that is not square, which the catalog is free to add. */
const TALL = { width: 900, height: 1200 }

/** The fit the editor would compute for a mockup in a box of this size. */
const fitIn = (mockup: typeof SQUARE, width: number, height: number) =>
  fitContain(mockup, { width, height })

describe('exportGeometry', () => {
  it('crops to the mockup rather than the whole stage', () => {
    // A wide desktop box: the mockup is centred with paper either side, and
    // none of that paper belongs in the picture.
    const fit = fitIn(SQUARE, 900, 600)
    const geometry = exportGeometry(SQUARE, fit)

    expect(geometry).not.toBeNull()
    expect(geometry).toMatchObject({
      x: fit.offsetX,
      y: fit.offsetY,
      width: fit.width,
      height: fit.height,
    })
    expect(fit.offsetX).toBeGreaterThan(0)
  })

  it('renders at twice the size on screen', () => {
    // 600 on screen, so 1200 — which is above the mockup's own 1000.
    const fit = fitIn(SQUARE, 600, 600)
    const geometry = exportGeometry(SQUARE, fit)

    expect(geometry?.pixelRatio).toBe(2)
    expect(exportedSize(geometry!)).toEqual({ width: 1200, height: 1200 })
  })

  it('falls back to the mockup size when twice the screen is smaller', () => {
    // A phone: 360px of shawl on screen would export a 720px picture of a
    // design drawn in 1000 units, throwing away detail that is really there.
    const fit = fitIn(SQUARE, 360, 360)
    const geometry = exportGeometry(SQUARE, fit)

    expect(exportedSize(geometry!)).toEqual({ width: 1000, height: 1000 })
    expect(geometry?.pixelRatio).toBeCloseTo(1000 / 360, 10)
  })

  it('caps the longer edge', () => {
    // A large desktop: twice 1400 is 2800, which nobody needs to download.
    const fit = fitIn(SQUARE, 1400, 1400)
    const geometry = exportGeometry(SQUARE, fit)

    expect(exportedSize(geometry!)).toEqual({
      width: MAX_EXPORT_EDGE,
      height: MAX_EXPORT_EDGE,
    })
  })

  it('caps the longer edge of a mockup that is not square', () => {
    const fit = fitIn(TALL, 1400, 1400)
    const geometry = exportGeometry(TALL, fit)
    const size = exportedSize(geometry!)

    expect(size.height).toBe(MAX_EXPORT_EDGE)
    // The shape the designer drew survives the cap.
    expect(size.width / size.height).toBeCloseTo(TALL.width / TALL.height, 2)
    expect(size.width).toBeLessThan(MAX_EXPORT_EDGE)
  })

  it('keeps the mockup aspect ratio at every size', () => {
    for (const box of [300, 600, 900, 1400]) {
      const size = exportedSize(exportGeometry(TALL, fitIn(TALL, box, box))!)

      expect(size.width / size.height).toBeCloseTo(TALL.width / TALL.height, 2)
      expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(
        MAX_EXPORT_EDGE,
      )
    }
  })

  it('never exports smaller than the design was drawn', () => {
    for (const box of [120, 360, 500, 1000]) {
      const size = exportedSize(
        exportGeometry(SQUARE, fitIn(SQUARE, box, box))!,
      )

      expect(Math.max(size.width, size.height)).toBeGreaterThanOrEqual(
        Math.max(SQUARE.width, SQUARE.height),
      )
    }
  })

  it('has nothing to export from a stage that has not been measured', () => {
    // What `fitContain` answers before the ResizeObserver has reported.
    expect(exportGeometry(SQUARE, fitIn(SQUARE, 0, 0))).toBeNull()
  })
})
