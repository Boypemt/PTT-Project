// Loaded by Vitest before every test file (see `test.setupFiles` in vite.config.ts).
// Registers the jest-dom matchers (toBeInTheDocument, toHaveTextContent, …) and
// unmounts React trees between tests.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
