/**
 * The front door: why these products exist, what a visitor can do with them,
 * and the way into the customizer.
 *
 * This is the one page outside `CatalogGate` (see `AppRoutes`), so that a
 * broken catalog file still leaves a readable site. Everything data-driven here
 * therefore has to cope with the catalog not being there: the page reads it if
 * it is ready and leaves those sections out if it is not, rather than holding
 * the whole page back behind a spinner.
 */
import { useTranslation } from 'react-i18next'
import { useCatalog } from '@/catalog'
import { PlaceholderNote } from '@/components/PlaceholderNote'
import { pickHeroPattern, pickHeroProduct } from '@/lib/hero'
import { CommunityFacts } from './CommunityFacts'
import { HeroSection } from './HeroSection'
import { HowItWorks } from './HowItWorks'
import { LeafColorStrip } from './LeafColorStrip'

export function LandingPage() {
  const { t } = useTranslation()
  const { status, catalog } = useCatalog()

  const ready = status === 'ready' ? catalog : null

  return (
    <>
      <HeroSection
        product={ready === null ? undefined : pickHeroProduct(ready.products)}
        tile={ready === null ? undefined : pickHeroPattern(ready.patterns)}
      />

      <HowItWorks />

      <LeafColorStrip dyes={ready?.leafDyes ?? []} />

      <CommunityFacts />

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <PlaceholderNote>{t('home.placeholder')}</PlaceholderNote>
      </section>
    </>
  )
}
