/**
 * What a key press means to the selected leaf.
 *
 * Kept apart from the canvas so the mapping can be read and tested on its own:
 * which keys do something, what a modifier changes, and — just as much — which
 * keys this must keep its hands off. A canvas that swallowed every key press
 * would take Tab away from someone moving through the page with a keyboard,
 * which is the one group this has to be careful of.
 *
 * Arrows nudge in mockup units, so a leaf moves the same distance on the cloth
 * whatever size the window is. Five units is a touch under half a millimetre
 * on a shawl — the step you want when a leaf is nearly right — and Shift makes
 * it twenty-five, which crosses a print area in a dozen presses.
 *
 * Backspace deletes as well as Delete: a Mac laptop's main delete key sends
 * Backspace, and "the key with delete written on it does not delete" is a bug
 * report waiting to happen.
 */

/** Mockup units an arrow moves a leaf. */
export const NUDGE = 5

/** And with Shift held. */
export const NUDGE_FAR = 25

export type MotifKeyAction =
  | { type: 'nudge'; dx: number; dy: number }
  | { type: 'duplicate' }
  | { type: 'delete' }

/** The part of a keyboard event this reads. */
export type KeyChord = {
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  // Mockup y grows downwards, as it does on a screen and in the catalog.
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/** The action `chord` asks for, or `null` to leave the key alone. */
export function motifKeyAction(chord: KeyChord): MotifKeyAction | null {
  const { key, shiftKey, ctrlKey, metaKey } = chord
  const command = ctrlKey || metaKey

  if (command) {
    // Ctrl/Cmd+D. Everything else with a modifier belongs to the browser or
    // the operating system — Ctrl+Arrow jumps a word, Cmd+Arrow goes back.
    return key.toLowerCase() === 'd' ? { type: 'duplicate' } : null
  }

  const arrow = ARROWS[key]

  if (arrow !== undefined) {
    const step = shiftKey ? NUDGE_FAR : NUDGE

    return { type: 'nudge', dx: arrow.x * step, dy: arrow.y * step }
  }

  if (key === 'Delete' || key === 'Backspace') return { type: 'delete' }

  return null
}
