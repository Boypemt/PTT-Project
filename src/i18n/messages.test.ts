/**
 * CLAUDE.md requires every user-visible string in both languages. This is the
 * check: the two files must hold exactly the same keys, with a string at each.
 */
import { describe, expect, it } from 'vitest'
import en from './en.json'
import th from './th.json'

type Messages = { [key: string]: string | Messages }

/** Flattens `{ nav: { home: 'x' } }` to `['nav.home']`. */
function keyPaths(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return typeof value === 'string' ? [path] : keyPaths(value, path)
  })
}

/** Every `{{name}}` in a message, so the two languages can be compared. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/{{(\w+)}}/g)].map((match) => match[1]).sort()
}

function messageAt(messages: Messages, path: string): string {
  const value = path
    .split('.')
    .reduce<string | Messages>((node, key) => (node as Messages)[key], messages)

  return value as string
}

const thKeys = keyPaths(th)
const enKeys = keyPaths(en)

describe('translation catalogs', () => {
  it('has at least one key', () => {
    expect(thKeys.length).toBeGreaterThan(0)
  })

  it('holds the same keys in th.json and en.json', () => {
    expect(enKeys.toSorted()).toEqual(thKeys.toSorted())
  })

  it('has no blank message', () => {
    const blank = thKeys.filter(
      (path) =>
        messageAt(th, path).trim() === '' || messageAt(en, path).trim() === '',
    )

    expect(blank).toEqual([])
  })

  it('uses the same interpolation placeholders in both languages', () => {
    const mismatched = thKeys.filter(
      (path) =>
        placeholders(messageAt(th, path)).join() !==
        placeholders(messageAt(en, path)).join(),
    )

    expect(mismatched).toEqual([])
  })
})
