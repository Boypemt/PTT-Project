/**
 * i18next setup, imported once for its side effect (see `src/app/App.tsx` and
 * the Vitest setup file).
 *
 * Thai is both the start language and the fallback, so a key that only exists
 * in `th.json` still renders — the key-parity test in `messages.test.ts` is
 * what stops `en.json` drifting behind.
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import { DEFAULT_LANGUAGE, readStoredLanguage } from './language'
import th from './th.json'

/** Single namespace: the app is small enough that splitting buys nothing. */
export const defaultNS = 'translation'

export const resources = {
  th: { translation: th },
  en: { translation: en },
} as const

void i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  // React already escapes everything it renders.
  interpolation: { escapeValue: false },
})

export default i18next
