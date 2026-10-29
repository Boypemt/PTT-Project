/**
 * "เสร็จแล้ว / Done": the way out of the editor with the design in hand.
 *
 * In the page header rather than in the bottom sheet, and that is a layout
 * decision worth writing down. The sheet on a phone has no vertical slack at
 * all — the canvas takes what it leaves, and the pattern names already sit on
 * its last line — so a row added there is a row taken off the thing the
 * visitor is designing. The header has a 44px row in it already, which the
 * back link set, and this sits on the far end of it at no cost in height.
 *
 * Today it downloads the PNG. The task after this one puts the request dialog
 * behind it — the summary, the fields and the ways to send it — and the
 * download becomes one of the things that dialog offers. The name is the same
 * either way, because what the visitor is doing is the same: they have
 * finished, and they want the design.
 *
 * Behind the `export` flag until that is all in. `CustomizePage` reads the
 * same flag for the subtitle it hides to make room, so there is one answer to
 * "is this feature on" per render rather than two that could disagree.
 */
import { useTranslation } from 'react-i18next'
import { renderDesignPng } from '@/editor/designPng'
import { downloadDesignPng } from './downloadDesign'

export function ExportButton({ productId }: { productId: string }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => {
        const png = renderDesignPng()

        // Only before the browser has measured the canvas, which is a frame or
        // two after the editor opens and long before anyone can reach this
        // button. Nothing to tell the visitor, and nothing worth an error
        // message that would only ever be read by a stopwatch.
        if (png === null) return

        downloadDesignPng(png, productId)
      }}
      className="ml-auto flex min-h-touch items-center rounded-xl bg-forest-600 px-4 font-medium text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
    >
      {t('export.done')}
    </button>
  )
}
