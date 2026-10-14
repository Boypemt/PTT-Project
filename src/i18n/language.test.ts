import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
  storeLanguage,
  toLanguage,
} from './language'

afterEach(() => {
  window.localStorage.clear()
})

describe('isLanguage', () => {
  it('accepts the supported languages and nothing else', () => {
    expect(isLanguage('th')).toBe(true)
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
    expect(isLanguage(null)).toBe(false)
  })
})

describe('toLanguage', () => {
  it('strips the region from a tag like en-GB', () => {
    expect(toLanguage('en-GB')).toBe('en')
  })

  it('falls back to Thai for an unknown or missing tag', () => {
    expect(toLanguage('fr')).toBe(DEFAULT_LANGUAGE)
    expect(toLanguage(undefined)).toBe(DEFAULT_LANGUAGE)
  })
})

describe('readStoredLanguage and storeLanguage', () => {
  it('round-trips a stored language', () => {
    storeLanguage('en')

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(readStoredLanguage()).toBe('en')
  })

  it('returns null when nothing valid is stored', () => {
    expect(readStoredLanguage()).toBeNull()

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon')
    expect(readStoredLanguage()).toBeNull()
  })

  it('survives storage that throws, as in private browsing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('access denied')
    })

    expect(readStoredLanguage()).toBeNull()
    expect(() => {
      storeLanguage('en')
    }).not.toThrow()
  })
})
