/**
 * What the canvas draws, in the order it draws it.
 *
 * The stage's stacking is the whole trick of this editor: the tinted
 * silhouette first, then one clipped group per print area holding that area's
 * layers, then the shading multiplied over everything. The first and last of
 * those are single nodes, but the middle needs the design's flat layer list
 * turned into one bucket per print area — and a decision about a layer that
 * names an area the product does not have.
 *
 * That regrouping is the part worth testing, so it lives here as a plain
 * function rather than inside the component.
 */
import type { Design, Layer, PrintArea, Product } from '@/catalog'

/** One clipped group: the area and the layers printed on it. */
export type SceneArea = {
  area: PrintArea
  /** In render order — the last entry sits nearest the viewer. */
  layers: Layer[]
}

export type Scene = {
  /** In the catalog's order, so a product decides which area is on top. */
  areas: SceneArea[]
  /**
   * Layers naming an area the product does not have. Dropped rather than
   * drawn unclipped: an unknown area is a broken design, and a pattern
   * spilling over the whole mockup would hide that rather than show it.
   */
  orphans: Layer[]
}

export function buildScene(product: Product, design: Design): Scene {
  const areas = product.printAreas.map((area) => ({
    area,
    layers: design.layers.filter((layer) => layer.printAreaId === area.id),
  }))
  const known = new Set(product.printAreas.map((area) => area.id))

  return {
    areas,
    orphans: design.layers.filter((layer) => !known.has(layer.printAreaId)),
  }
}
