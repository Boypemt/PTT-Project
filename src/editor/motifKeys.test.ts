import { describe, expect, it } from 'vitest'
import { motifKeyAction, NUDGE, NUDGE_FAR, type KeyChord } from './motifKeys'

const press = (key: string, modifiers: Partial<KeyChord> = {}) =>
  motifKeyAction({
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...modifiers,
  })

describe('arrows', () => {
  it('nudges one step in the direction of the arrow', () => {
    expect(press('ArrowRight')).toEqual({ type: 'nudge', dx: NUDGE, dy: 0 })
    expect(press('ArrowLeft')).toEqual({ type: 'nudge', dx: -NUDGE, dy: 0 })
    // Mockup y grows downwards, so up is negative.
    expect(press('ArrowUp')).toEqual({ type: 'nudge', dx: 0, dy: -NUDGE })
    expect(press('ArrowDown')).toEqual({ type: 'nudge', dx: 0, dy: NUDGE })
  })

  it('nudges further with Shift held', () => {
    expect(press('ArrowRight', { shiftKey: true })).toEqual({
      type: 'nudge',
      dx: NUDGE_FAR,
      dy: 0,
    })
    expect(press('ArrowUp', { shiftKey: true })).toEqual({
      type: 'nudge',
      dx: 0,
      dy: -NUDGE_FAR,
    })
  })

  it('leaves an arrow with Ctrl or Cmd to the browser', () => {
    expect(press('ArrowRight', { ctrlKey: true })).toBeNull()
    expect(press('ArrowLeft', { metaKey: true })).toBeNull()
  })
})

describe('delete', () => {
  it('answers to both delete keys, because a Mac sends Backspace', () => {
    expect(press('Delete')).toEqual({ type: 'delete' })
    expect(press('Backspace')).toEqual({ type: 'delete' })
  })
})

describe('duplicate', () => {
  it('is Ctrl+D and Cmd+D', () => {
    expect(press('d', { ctrlKey: true })).toEqual({ type: 'duplicate' })
    expect(press('d', { metaKey: true })).toEqual({ type: 'duplicate' })
  })

  it('does not mind the Shift that makes it a capital', () => {
    expect(press('D', { metaKey: true, shiftKey: true })).toEqual({
      type: 'duplicate',
    })
  })

  it('is not plain D, which is a letter someone may be typing', () => {
    expect(press('d')).toBeNull()
  })
})

describe('everything else', () => {
  it('is left alone', () => {
    for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a', 'F5', 'PageDown']) {
      expect(press(key)).toBeNull()
    }
  })

  it('leaves Tab alone with every modifier too', () => {
    expect(press('Tab', { shiftKey: true })).toBeNull()
    expect(press('Tab', { ctrlKey: true })).toBeNull()
  })

  it('leaves the other command shortcuts to the browser', () => {
    for (const key of ['s', 'z', 'c', 'v', 'r']) {
      expect(press(key, { ctrlKey: true })).toBeNull()
      expect(press(key, { metaKey: true })).toBeNull()
    }
  })
})
