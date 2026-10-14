/**
 * Keeps the page in step with the chosen language: `<html lang>` so screen
 * readers switch voice and the browser breaks Thai lines correctly, and
 * localStorage so the choice survives a reload. Mounted once, in the layout.
 */
import { useEffect } from 'react'
import { storeLanguage } from './language'
import { useLanguage } from './useLanguage'

export function useSyncLanguage(): void {
  const { language } = useLanguage()

  useEffect(() => {
    document.documentElement.lang = language
    storeLanguage(language)
  }, [language])
}
