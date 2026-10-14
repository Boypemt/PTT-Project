/**
 * React's way in to the editor store. The store itself (`store.ts`) stays free
 * of React, so this file is the only place the two meet.
 *
 * Components select the slice they need — `useDesignStore((s) => s.design
 * .baseColor)` — and re-render only when that slice changes. Actions are
 * selected the same way; they are created once, so their identity is stable.
 */
import { useEffect } from 'react'
import { useStore } from 'zustand'
import type { Design, Product } from '@/catalog'
import { designForProduct, editorStore, type EditorStore } from './store'

export function useDesignStore<T>(selector: (state: EditorStore) => T): T {
  return useStore(editorStore, selector)
}

/**
 * The design for `product`, starting one if the store is not on that product
 * yet.
 *
 * Re-opening the same product keeps what the visitor made — the guard means
 * navigating back does not wipe a design, and that several components may call
 * this for the same product without resetting each other. Opening a different
 * product starts fresh.
 *
 * The effect only runs after the first paint, so until then this reports the
 * design the product starts with rather than the one still in the store.
 */
export function useDesignFor(product: Product): Design {
  const design = useDesignStore((state) => state.design)
  const initForProduct = useDesignStore((state) => state.initForProduct)

  useEffect(() => {
    if (editorStore.getState().design.productId !== product.id) {
      initForProduct(product)
    }
  }, [initForProduct, product])

  return design.productId === product.id ? design : designForProduct(product)
}
