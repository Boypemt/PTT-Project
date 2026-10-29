import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canRenderDesignPng,
  renderDesignPng,
  setDesignRenderer,
  type DesignPng,
} from './designPng'

const PNG: DesignPng = {
  dataUrl: 'data:image/png;base64,abc',
  width: 1000,
  height: 1000,
}

afterEach(() => {
  setDesignRenderer(null)
  vi.restoreAllMocks()
})

describe('the design renderer slot', () => {
  it('has nothing to render before a canvas registers', () => {
    expect(canRenderDesignPng()).toBe(false)
    expect(renderDesignPng()).toBeNull()
  })

  it('renders through whatever the canvas left', () => {
    setDesignRenderer(() => PNG)

    expect(canRenderDesignPng()).toBe(true)
    expect(renderDesignPng()).toEqual(PNG)
  })

  it('passes a canvas that cannot render yet straight through', () => {
    // An unmeasured stage, which is what the canvas answers on the first paint.
    setDesignRenderer(() => null)

    expect(canRenderDesignPng()).toBe(true)
    expect(renderDesignPng()).toBeNull()
  })

  it('empties when the canvas unmounts, so no stale stage is photographed', () => {
    setDesignRenderer(() => PNG)
    setDesignRenderer(null)

    expect(canRenderDesignPng()).toBe(false)
    expect(renderDesignPng()).toBeNull()
  })

  it('lets one canvas replace itself without complaining', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    // What a resize does: the old renderer is taken away, the new one left.
    setDesignRenderer(() => PNG)
    setDesignRenderer(null)
    setDesignRenderer(() => PNG)

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when a second canvas registers over a live one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const second: DesignPng = { ...PNG, width: 500 }

    setDesignRenderer(() => PNG)
    setDesignRenderer(() => second)

    expect(warn).toHaveBeenCalledOnce()
    // Still usable — a warning, not a refusal.
    expect(renderDesignPng()).toEqual(second)
  })
})
