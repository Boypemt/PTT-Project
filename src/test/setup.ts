// Loaded by Vitest before every test file (see `test.setupFiles` in vite.config.ts).
// Registers the jest-dom matchers (toBeInTheDocument, toHaveTextContent, …),
// swaps react-konva for a DOM stub (jsdom has no 2D context — see
// `reactKonvaStub.tsx`), fills in the ResizeObserver jsdom lacks, unmounts
// React trees between tests, and resets the two global singletons a test can
// leave behind: the i18next language and localStorage.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import { DEFAULT_LANGUAGE } from '@/i18n/language'

vi.mock('react-konva', () => import('./reactKonvaStub'))

// jsdom lays nothing out, so an observer that never fires reports exactly as
// much as a real one would here: every element is 0×0.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(async () => {
  window.localStorage.clear()
  document.documentElement.lang = DEFAULT_LANGUAGE
  await i18n.changeLanguage(DEFAULT_LANGUAGE)
})

afterEach(() => {
  cleanup()
})
