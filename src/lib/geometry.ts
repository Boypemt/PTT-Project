/**
 * The maths that puts a product mockup on screen.
 *
 * A mockup is drawn in its own coordinate space — the `width`/`height` in
 * products.json, the space print areas and layer positions are written in. The
 * editor shows it inside a box of whatever size the browser window leaves, so
 * every frame needs one answer: how much to scale the mockup, and where to put
 * it. `fitContain` gives that answer, and the two `to…Point` helpers carry
 * points between the spaces — a pointer position in, a layer position out.
 *
 * Pure, no DOM and no canvas, so the canvas work in the next PR can be reasoned
 * about (and tested) without a renderer.
 */

export type Size = { width: number; height: number }

export type Point = { x: number; y: number }

export type Rect = Point & Size

/** Where and how large the mockup sits inside its container, in stage pixels. */
export type Fit = {
  /** Stage pixels per mockup unit. */
  scale: number
  /** Stage position of the mockup's top-left corner. */
  offsetX: number
  offsetY: number
  /** The scaled mockup's size, handy for the stage's own layout. */
  width: number
  height: number
}

/** A fit that draws nothing, for a container or mockup with no area yet. */
const EMPTY_FIT: Fit = {
  scale: 0,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

/** Keeps a point inside a rectangle, corners included. */
export function clampPointToRect(point: Point, rect: Rect): Point {
  return {
    x: clamp(point.x, rect.x, rect.x + rect.width),
    y: clamp(point.y, rect.y, rect.y + rect.height),
  }
}

/**
 * Fits `content` inside `container` the way `object-fit: contain` does: as
 * large as it goes without cropping or distorting, centred on both axes.
 *
 * A container that is still being measured (zero width during the first paint,
 * before the ResizeObserver reports) gives a zero fit rather than `Infinity` or
 * `NaN`, so a caller can draw nothing and wait.
 */
export function fitContain(content: Size, container: Size): Fit {
  const sides = [
    content.width,
    content.height,
    container.width,
    container.height,
  ]
  if (sides.some((side) => !Number.isFinite(side) || side <= 0)) {
    return EMPTY_FIT
  }

  const scale = Math.min(
    container.width / content.width,
    container.height / content.height,
  )
  const width = content.width * scale
  const height = content.height * scale

  return {
    scale,
    offsetX: (container.width - width) / 2,
    offsetY: (container.height - height) / 2,
    width,
    height,
  }
}

/** Mockup space → stage pixels. */
export function toStagePoint(point: Point, fit: Fit): Point {
  return {
    x: point.x * fit.scale + fit.offsetX,
    y: point.y * fit.scale + fit.offsetY,
  }
}

/**
 * Stage pixels → mockup space, e.g. where a tap landed on the cloth.
 *
 * A zero-scale fit has no mockup space to answer with, so it maps everything
 * to the origin.
 */
export function toMockupPoint(point: Point, fit: Fit): Point {
  if (fit.scale <= 0) return { x: 0, y: 0 }

  return {
    x: (point.x - fit.offsetX) / fit.scale,
    y: (point.y - fit.offsetY) / fit.scale,
  }
}

/**
 * How many device pixels Konva should render per stage pixel.
 *
 * Capped, because a phone reporting 3 or 4 would have the canvas redraw an
 * area several times larger than the screen on every drag, for a sharpness no
 * one can see. Falls back to 1 where `devicePixelRatio` is missing (jsdom, an
 * old browser).
 */
export function pixelRatio(
  devicePixelRatio: number | undefined,
  max = 2,
): number {
  if (devicePixelRatio === undefined || !Number.isFinite(devicePixelRatio)) {
    return 1
  }

  return clamp(devicePixelRatio, 1, max)
}
