// Loaded by Vitest before every test file (see `test.setupFiles` in vite.config.ts).
// Registers the jest-dom matchers (toBeInTheDocument, toHaveTextContent, …),
// unmounts React trees between tests, and resets the two global singletons a
// test can leave behind: the i18next language and localStorage.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import i18n from '@/i18n'
import { DEFAULT_LANGUAGE } from '@/i18n/language'

beforeEach(async () => {
  window.localStorage.clear()
  document.documentElement.lang = DEFAULT_LANGUAGE
  await i18n.changeLanguage(DEFAULT_LANGUAGE)
})

afterEach(() => {
  cleanup()
})
