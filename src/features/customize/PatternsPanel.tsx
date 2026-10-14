/**
 * The left panel: the library a visitor picks patterns from.
 *
 * The grid itself arrives in the next commit; the print-area chips are here
 * because what the library may offer depends on which area is selected.
 */
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { PlaceholderNote } from '@/components/PlaceholderNote'
import { PrintAreaSelector } from './PrintAreaSelector'

export function PatternsPanel({ product }: { product: Product }) {
  const { t } = useTranslation()

  return (
    <>
      <PrintAreaSelector product={product} />
      <PlaceholderNote>{t('customize.patternsPlaceholder')}</PlaceholderNote>
    </>
  )
}
