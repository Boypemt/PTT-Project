/**
 * Reads a `Localized` field out of catalog data in the active language.
 *
 * Catalog entries carry every language at once (`{ th, en }`), so they cannot
 * go through `t()`. This is the one place that knows which field to pick —
 * components just call `localized(product.name)`.
 */
import { useCallback } from 'react'
import type { Localized } from '@/catalog'
import { useLanguage } from './useLanguage'

export function useLocalized(): (value: Localized) => string {
  const { language } = useLanguage()

  return useCallback((value: Localized) => value[language], [language])
}
