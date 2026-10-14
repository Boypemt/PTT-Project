/**
 * Where a visitor picks what to customize. A placeholder until task 06 —
 * see docs/ROADMAP.md.
 */
import { useTranslation } from 'react-i18next'
import { PlaceholderNote } from '@/components/PlaceholderNote'

export function ProductPickerPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-5 px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-teak-700">
        {t('products.title')}
      </h1>
      <p className="text-lg text-ink-500">{t('products.intro')}</p>
      <PlaceholderNote>{t('products.placeholder')}</PlaceholderNote>
    </section>
  )
}
