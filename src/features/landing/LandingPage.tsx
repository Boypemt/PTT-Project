/**
 * The front door. A placeholder until task 13 brings the community story —
 * see docs/ROADMAP.md.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PlaceholderNote } from '@/components/PlaceholderNote'

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-5 px-4 py-12">
      <p className="font-medium uppercase tracking-[0.2em] text-forest-600">
        {t('brand.enterprise')}
      </p>
      <h1 className="font-display text-3xl font-bold text-balance text-teak-700 sm:text-4xl">
        {t('home.title')}
      </h1>
      <p className="text-lg text-ink-500">{t('home.intro')}</p>
      <Link
        to="/products"
        className="inline-flex min-h-touch items-center rounded-full bg-forest-600 px-6 font-medium text-paper-50 transition-colors hover:bg-forest-700"
      >
        {t('home.cta')}
      </Link>
      <PlaceholderNote>{t('home.placeholder')}</PlaceholderNote>
    </section>
  )
}
