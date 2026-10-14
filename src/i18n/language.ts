/**
 * The two languages the site speaks, and how the visitor's choice is remembered.
 *
 * Thai is the default and the fallback: the community reads Thai and every
 * catalog entry is guaranteed to have a `th` field. Storage is best-effort —
 * with site data blocked the site still works, it just forgets the choice.
 */

export const LANGUAGES = ['th', 'en'] as const

export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'th'

/** Namespaced so another prototype on the same origin can't collide with it. */
export const LANGUAGE_STORAGE_KEY = 'paton-phueng.language'

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

/** Narrows whatever i18next reports (`en`, `en-GB`, `undefined`) to a Language. */
export function toLanguage(value: string | undefined): Language {
  const base = value?.split('-')[0]
  return isLanguage(base) ? base : DEFAULT_LANGUAGE
}

export function readStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : null
  } catch {
    // Storage disabled (private mode, blocked cookies): fall back to the default.
    return null
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Same as above — remembering the language is a nicety, not a requirement.
  }
}
