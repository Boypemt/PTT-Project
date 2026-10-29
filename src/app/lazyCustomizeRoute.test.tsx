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
import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import th from '@/i18n/th.json'
import { makeProduct } from '@/test/catalogFixtures'
import { renderApp } from '@/test/renderApp'

/** Resolves when the test releases the editor's chunk. */
let arrive: () => void = () => {}
const chunk = new Promise<void>((resolve) => {
  arrive = resolve
})

/**
 * The real editor, loaded before the test starts rather than inside it.
 *
 * What this file holds back is the moment the route's chunk arrives — not
 * Vite's transform of it. Letting the factory import the page on release put
 * the editor's whole module graph inside the window an assertion allows,
 * which measured 300 ms of the 1000 ms budget when the rest of the suite was
 * running beside it: green on its own, and occasionally red in a full run.
 * Loaded here, the factory has nothing left to do but wait for the gate.
 */
const editor = await vi.importActual<
  typeof import('@/features/customize/CustomizePage')
>('@/features/customize/CustomizePage')

// The factory is registered now but only runs when `lazy` asks for the module,
// which is long after `chunk` exists. The real page is what it returns, so
// this delays the import rather than replacing what is under test.
vi.mock('@/features/customize/CustomizePage', async () => {
  await chunk
  return editor
})

describe('the code-split customizer route', () => {
  it('says it is opening while the chunk is on the wire, then shows the editor', async () => {
    const product = makeProduct()
    renderApp({ route: `/customize/${product.id}` })

    expect(await screen.findByText(th.customize.loading)).toBeInTheDocument()

    // Releasing the gate and flushing React inside one `act`: the chunk
    // resolves in a microtask and the editor is on screen when this returns,
    // so what follows is asserted outright rather than waited for. A test
    // that polls for the editor is a test that can run out of patience on a
    // busy machine, and this one has nothing left to be patient about.
    await act(async () => {
      arrive()
      await chunk
    })

    expect(
      screen.getByRole('heading', { level: 1, name: product.name.th }),
    ).toBeInTheDocument()
    expect(screen.queryByText(th.customize.loading)).not.toBeInTheDocument()
  })
})
