/**
 * The customizer itself. A placeholder until task 07 brings the canvas —
 * see docs/ROADMAP.md. For now it only proves the `:productId` param arrives.
 */
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { PlaceholderNote } from '@/components/PlaceholderNote'

export function CustomizePage() {
  const { t } = useTranslation()
  const { productId = '' } = useParams<{ productId: string }>()

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-5 px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-teak-700">
        {t('customize.title')}
      </h1>
      <p className="text-lg text-ink-500">
        {t('customize.product', { productId })}
      </p>
      <PlaceholderNote>{t('customize.placeholder')}</PlaceholderNote>
    </section>
  )
}
