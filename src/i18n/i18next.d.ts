/**
 * Types `t()` against the Thai catalog, so a typo or a key that was never added
 * fails `npm run typecheck` instead of rendering as its own key on screen.
 */
import type { defaultNS, resources } from './index'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['th']
  }
}
