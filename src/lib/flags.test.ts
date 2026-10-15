import { afterEach, describe, expect, it, vi } from 'vitest'
import { enabledFlags, FLAGS, isEnabled, isFlag, parseFlags } from './flags'

/** The parsed flags as a sorted array, which is easier to assert on. */
const parsed = (value: string | undefined) => [...parseFlags(value)].sort()

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isFlag', () => {
  it('knows every flag in the list', () => {
    for (const flag of FLAGS) expect(isFlag(flag)).toBe(true)
  })

  it('does not know anything else', () => {
    expect(isFlag('motif')).toBe(false)
    expect(isFlag('MOTIFS')).toBe(false)
    expect(isFlag('')).toBe(false)
  })
})

describe('parseFlags', () => {
  it('reads a comma-separated list', () => {
    expect(parsed('motifs,export')).toEqual(['export', 'motifs'])
  })

  it('is empty when the variable is unset or blank', () => {
    expect(parsed(undefined)).toEqual([])
    expect(parsed('')).toEqual([])
    expect(parsed('   ')).toEqual([])
    expect(parsed(',,')).toEqual([])
  })

  it('forgives the spacing and the capitals a dashboard invites', () => {
    expect(parsed(' motifs , Export ')).toEqual(['export', 'motifs'])
    expect(parsed('motifs,export,')).toEqual(['export', 'motifs'])
  })

  it('ignores a name it does not know, and keeps the ones it does', () => {
    expect(parsed('motifs,motive,3d')).toEqual(['motifs'])
    expect(parsed('nothing-like-a-flag')).toEqual([])
  })

  it('names a flag once however often it is listed', () => {
    expect(parsed('export,export,export')).toEqual(['export'])
  })
})

describe('isEnabled', () => {
  it('is false for every flag when VITE_FLAGS is unset', () => {
    for (const flag of FLAGS) expect(isEnabled(flag)).toBe(false)
  })

  it('is true only for the flags the build was given', () => {
    vi.stubEnv('VITE_FLAGS', 'motifs')

    expect(isEnabled('motifs')).toBe(true)
    expect(isEnabled('export')).toBe(false)
  })

  it('follows the variable rather than the value at import time', () => {
    vi.stubEnv('VITE_FLAGS', 'export')
    expect(enabledFlags()).toEqual(new Set(['export']))

    vi.stubEnv('VITE_FLAGS', 'history,preview-3d')
    expect(enabledFlags()).toEqual(new Set(['history', 'preview-3d']))
  })
})
