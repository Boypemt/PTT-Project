/**
 * Marks a page that only stands in for the real thing, so nobody reviewing the
 * prototype mistakes a route that is not built yet for one that is broken.
 */
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function PlaceholderNote({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <p className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-marigold-500 bg-marigold-100 px-4 py-3 text-sm text-ink-700">
      <span className="rounded-full bg-marigold-500 px-2 py-0.5 text-xs font-semibold uppercase text-ink-900">
        {t('common.placeholderLabel')}
      </span>
      {children}
    </p>
  )
}
