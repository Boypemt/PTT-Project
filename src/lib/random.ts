/**
 * A random sequence you can ask for twice.
 *
 * Scattering leaves needs randomness that is *reproducible*: the same seed has
 * to give the same handful of leaves in the same places, or there is no way to
 * test the scatter, and no way for a share link in task 11 to carry a design
 * that was made by one tap of the button. `Math.random` can do neither, since
 * it has no seed to write down.
 *
 * Mulberry32: thirty-two bits of state, a few lines of arithmetic, and a
 * spread good enough for leaves on cloth. It is not for anything that needs to
 * be unguessable — there is nothing here that does.
 *
 * Each `Random` carries its own state, so two of them with the same seed walk
 * the same sequence and neither disturbs the other.
 */

export type Random = {
  /** The next value in [0, 1). */
  next: () => number
  /** A number in [min, max). `min` back if the range is empty or backwards. */
  between: (min: number, max: number) => number
  /** A whole number in [min, max], both ends included. */
  int: (min: number, max: number) => number
  /** One of `items`. Throws on an empty list, which is a caller's mistake. */
  pick: <T>(items: readonly T[]) => T
}

/** Mixes a seed that may be 0, a small integer, or a timestamp. */
function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1

  // `>>> 0` keeps it a 32-bit unsigned integer, which is the state mulberry32
  // expects; a fractional or negative seed would otherwise walk a sequence of
  // its own that repeats sooner.
  return Math.trunc(Math.abs(seed)) >>> 0
}

export function createRandom(seed: number): Random {
  let state = normalizeSeed(seed)

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0

    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }

  const between = (min: number, max: number) =>
    max > min ? min + next() * (max - min) : min

  return {
    next,
    between,
    int: (min, max) => {
      const low = Math.ceil(Math.min(min, max))
      const high = Math.floor(Math.max(min, max))

      return high > low ? low + Math.floor(next() * (high - low + 1)) : low
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error('createRandom().pick needs something to pick from')
      }

      return items[Math.floor(next() * items.length)]
    },
  }
}
