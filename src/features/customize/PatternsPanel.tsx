/**
 * The left panel: the library a visitor picks patterns from.
 *
 * A placeholder until task 08 brings the pattern library and tile layers —
 * see docs/ROADMAP.md.
 */
import { useTranslation } from 'react-i18next'
import { PlaceholderNote } from '@/components/PlaceholderNote'

export function PatternsPanel() {
  const { t } = useTranslation()

  return <PlaceholderNote>{t('customize.patternsPlaceholder')}</PlaceholderNote>
}
