/**
 * Thai cannot take the Latin display tricks: letter-spacing pulls vowel and
 * tone marks away from the consonant they belong to, and there are no capitals
 * to make. Both treatments therefore only ever apply behind the `en:` variant
 * defined in `src/index.css`.
 *
 * This is the check, run over the components rather than over one of them: a
 * bare `tracking-*` or `uppercase` in a className reaches Thai text as soon as
 * someone writes it, and nothing else in the suite would notice.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_DIR = 'src'

/**
 * Letter-spacing and capitalising, as Tailwind utilities and as raw CSS, not
 * already behind `en:`. `uppercase` is matched case-sensitively so that
 * `toUpperCase()` on a string is not mistaken for a class.
 */
const UNGUARDED =
  /(?<!en:)\b(?:tracking-[^\s"'`]+|uppercase|capitalize|letterSpacing|letter-spacing|text-transform)\b/g

/** Every component file, with forward slashes — tests are not components. */
function componentPaths(): string[] {
  return readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((entry) => entry.endsWith('.tsx') && !entry.endsWith('.test.tsx'))
    .sort()
}

describe('thai typography', () => {
  it('reads some components', () => {
    expect(componentPaths().length).toBeGreaterThan(0)
  })

  it('applies letter-spacing and capitals only behind the en: variant', () => {
    const offences = componentPaths().flatMap((path) =>
      readFileSync(join(SRC_DIR, path), 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          [...line.matchAll(UNGUARDED)].map(
            (match) => `${path}:${String(index + 1)} ${match[0]}`,
          ),
        ),
    )

    expect(offences).toEqual([])
  })
})
