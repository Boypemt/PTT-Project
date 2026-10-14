/**
 * Adds `<meta name="robots" content="noindex">` for as long as the component
 * is mounted, and takes it away again on the way out.
 *
 * Used by pages that ship in every build so the team can reach them on the
 * Vercel preview, but that are not part of the public site.
 */
import { useEffect } from 'react'

export function useNoIndex(): void {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.append(meta)

    return () => {
      meta.remove()
    }
  }, [])
}
