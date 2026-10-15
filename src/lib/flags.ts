/**
 * Which unfinished features are switched on.
 *
 * The rule this exists for: a feature goes into `main` behind a flag from its
 * first commit and the flag comes out when the feature is done. Vercel's
 * Preview environment sets `VITE_FLAGS`, so the team can try work in progress
 * on a real link; Production leaves it unset, so a visitor — or the community
 * showing the site at a booth — only ever meets finished work. That is what
 * lets half a feature sit in `main` without a long-lived branch rotting beside
 * it.
 *
 * `VITE_FLAGS` is a comma-separated list: `VITE_FLAGS=motifs,export`. Vite
 * replaces it at build time, so the value is baked into the bundle and
 * changing it on Vercel means a redeploy, not a reload.
 *
 * A name nobody recognises is ignored rather than thrown. The variable is
 * typed into a dashboard by hand, and a typo there must not take the site
 * down — the feature simply stays off, which is the safe way round.
 */

/** Every flag the app knows, and the roadmap task each one hides. */
export const FLAGS = [
  'motifs', // 09: placeable leaf motifs with transform handles
  'history', // 11: undo/redo, autosave and the share link
  'export', // 12: PNG export and the order request summary
  'preview-3d', // 16: the 3D preview tab (phase 2)
] as const

export type Flag = (typeof FLAGS)[number]

export function isFlag(name: string): name is Flag {
  return (FLAGS as readonly string[]).includes(name)
}

/**
 * The flags named in `value`. Names are trimmed and lowercased, because
 * `motifs, Export` is what a hurried hand types into an env var; anything left
 * that is not a flag is dropped.
 */
export function parseFlags(value: string | undefined): Set<Flag> {
  const names = (value ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())

  return new Set(names.filter(isFlag))
}

/** The flags this build was made with. */
export function enabledFlags(): Set<Flag> {
  return parseFlags(import.meta.env.VITE_FLAGS)
}

/**
 * Whether `flag` is on.
 *
 * Typed to the known flags, so a flag that has been misspelled — or removed
 * once its feature shipped — is a compile error at the call site instead of a
 * feature that silently never appears again.
 *
 * The variable is read on each call rather than once at import: it is a split
 * and a trim of a short string, and nothing in the app reads it in a loop.
 */
export function isEnabled(flag: Flag): boolean {
  return enabledFlags().has(flag)
}
