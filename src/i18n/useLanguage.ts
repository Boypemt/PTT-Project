/** Reading and changing the active language, narrowed to the two we support. */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toLanguage, type Language } from './language'

export type UseLanguage = {
  language: Language
  setLanguage: (language: Language) => void
}

export function useLanguage(): UseLanguage {
  const { i18n } = useTranslation()
  const language = toLanguage(i18n.resolvedLanguage ?? i18n.language)

  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next)
    },
    [i18n],
  )

  return { language, setLanguage }
}
