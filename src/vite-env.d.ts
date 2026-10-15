/// <reference types="vite/client" />

/**
 * The environment variables this app reads, declared so they are typed rather
 * than `any` — Vite's own `ImportMetaEnv` falls back to an index signature for
 * everything it has not been told about.
 */
interface ImportMetaEnv {
  /**
   * Comma-separated feature flags, e.g. `motifs,export`. Set on Vercel's
   * Preview environment and left unset on Production; see `src/lib/flags.ts`.
   */
  readonly VITE_FLAGS?: string
}
