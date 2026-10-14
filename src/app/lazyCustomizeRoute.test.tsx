/**
 * The customizer is code-split, so opening it has a moment with nothing to
 * render yet. This file is the one place that moment can be observed: the
 * editor's module is held back until the test lets it arrive, which is what a
 * slow connection does on its own.
 *
 * It lives apart from `AppRoutes.test.tsx` because the hold is a module mock
 * for the whole file — every other routing test wants the editor to open
 * without being asked twice.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import th from '@/i18n/th.json'
import { makeProduct } from '@/test/catalogFixtures'
import { renderApp } from '@/test/renderApp'

/** Resolves when the test releases the editor's chunk. */
let arrive: () => void = () => {}
const chunk = new Promise<void>((resolve) => {
  arrive = resolve
})

// The factory is registered now but only runs when `lazy` asks for the module,
// which is long after `chunk` exists. The real page is what it returns, so
// this delays the import rather than replacing what is under test.
vi.mock('@/features/customize/CustomizePage', async (importOriginal) => {
  await chunk
  return importOriginal<typeof import('@/features/customize/CustomizePage')>()
})

describe('the code-split customizer route', () => {
  it('says it is opening while the chunk is on the wire, then shows the editor', async () => {
    const product = makeProduct()
    renderApp({ route: `/customize/${product.id}` })

    expect(await screen.findByText(th.customize.loading)).toBeInTheDocument()

    arrive()

    expect(
      await screen.findByRole('heading', { level: 1, name: product.name.th }),
    ).toBeInTheDocument()
    expect(screen.queryByText(th.customize.loading)).not.toBeInTheDocument()
  })
})
