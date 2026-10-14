/**
 * A DOM stand-in for react-konva, registered for every test file in
 * `setup.ts`.
 *
 * react-konva renders through a reconciler into Konva nodes, and Konva needs a
 * real 2D context the moment a stage is created. jsdom has none, and the
 * native `canvas` package is a node-gyp build we are not putting into CI, so
 * the stage cannot run in a unit test at all. The stub lets the pages that
 * hold a canvas render, so the rest of the editor page stays testable; what
 * the canvas actually paints is covered by the pure helpers next to it
 * (`scene.ts`, `clip.ts`) and, from task 14, by Playwright.
 *
 * Each node becomes a `div` carrying only its type, because asserting on
 * props here would be asserting on this file rather than on Konva.
 */
import type { ReactNode } from 'react'

function stub(name: string) {
  const Node = ({ children }: { children?: ReactNode }) => (
    <div data-konva={name}>{children}</div>
  )
  Node.displayName = `Konva${name}`

  return Node
}

export const Stage = stub('Stage')
export const Layer = stub('Layer')
export const Group = stub('Group')
export const Rect = stub('Rect')
export const Path = stub('Path')
export const Image = stub('Image')
