/**
 * TH/EN switch. Two buttons rather than a <select> so both options are visible
 * and reachable with one tap on a phone; `aria-pressed` carries which is on.
 */
import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/i18n/language'
import { useLanguage } from '@/i18n/useLanguage'

/** The label keys, spelled out so `t()` stays type-checked against th.json. */
const LABEL_KEY = { th: 'language.th', en: 'language.en' } as const

export function LanguageToggle() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex items-center gap-0.5 rounded-full border border-border-soft p-0.5"
    >
      {LANGUAGES.map((option: Language) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={language === option}
          onClick={() => {
            setLanguage(option)
          }}
          className={`min-h-touch rounded-full px-3 text-sm font-medium transition-colors ${
            language === option
              ? 'bg-forest-600 text-paper-50'
              : 'text-ink-500 hover:bg-paper-100 hover:text-ink-900'
          }`}
        >
          {t(LABEL_KEY[option])}
        </button>
      ))}
    </div>
  )
}
