/**
 * The one way anything outside the canvas can get a picture of the design.
 *
 * The button that exports a design lives in the editor page header, and the
 * stage lives three components further in, behind the workspace that arranges
 * the panels around it. Threading a ref from one to the other would mean the
 * workspace — which is deliberately free of Konva, so it can be laid out and
 * tested without a renderer — growing a prop about exporting that it would only
 * pass along.
 *
 * So the canvas leaves a renderer here while it is mounted, and whoever wants a
 * PNG asks for one. There is exactly one editor stage on screen at a time, which
 * is what makes a single slot the right shape rather than a registry keyed by
 * something; a second one would be a bug, and the warning below says so instead
 * of quietly exporting whichever registered last.
 *
 * Nothing here knows what a design is or how it is drawn. What to hide before
 * the shutter, and which part of the stage to keep, are the canvas's own
 * business — see `EditorCanvas`.
 */

/** A rendered design: the PNG itself, and the size it came out at. */
export type DesignPng = {
  /** `data:image/png;base64,…`, as Konva hands it over. */
  dataUrl: string
  width: number
  height: number
}

/** Renders the design on screen right now, or `null` if it cannot yet. */
export type RenderDesignPng = () => DesignPng | null

let renderer: RenderDesignPng | null = null

/**
 * Leaves a renderer for the stage that is on screen, or takes it away again
 * with `null`.
 *
 * Called from the canvas's own effect, so the slot empties when the visitor
 * leaves the editor and a stale stage can never be photographed.
 */
export function setDesignRenderer(render: RenderDesignPng | null): void {
  if (render !== null && renderer !== null) {
    // Two stages at once means the slot no longer says which design an export
    // is of. Nothing in the app does this today; a layout that started to would
    // otherwise look like it worked.
    console.warn(
      'a second editor canvas registered itself — exports will be of the newer one',
    )
  }

  renderer = render
}

/** Whether there is a canvas mounted that could be exported. */
export function canRenderDesignPng(): boolean {
  return renderer !== null
}

/**
 * A PNG of the design on screen, or `null` when there is none to take — no
 * canvas mounted, or a stage whose box the browser has not measured yet.
 */
export function renderDesignPng(): DesignPng | null {
  return renderer === null ? null : renderer()
}
