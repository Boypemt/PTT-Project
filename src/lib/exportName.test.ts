import process from 'node:process'
import { afterEach, describe, expect, it } from 'vitest'
import { dateStamp, exportFileName } from './exportName'

/** Local time, which is what both functions read. Months are 0-based. */
const on = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour)

describe('dateStamp', () => {
  it('writes the year, month and day with no separators', () => {
    expect(dateStamp(on(2026, 10, 29))).toBe('20261029')
  })

  it('pads a single-digit month and day', () => {
    expect(dateStamp(on(2026, 1, 5))).toBe('20260105')
  })

  it('refuses an invalid date rather than writing NaN into a filename', () => {
    expect(() => dateStamp(new Date(Number.NaN))).toThrow(RangeError)
  })
})

/**
 * The timezone is pinned rather than taken from whatever machine is running
 * the suite: CI is on UTC, where local time and UTC agree and a `toISOString()`
 * implementation would pass every assertion below without being right. Node
 * re-reads `process.env.TZ` on the next `Date`, so each case gets the clock it
 * is about — and the `toISOString()` line in each pins that the instant really
 * does fall on a different UTC day, so neither can go quietly vacuous.
 */
describe('dateStamp, on a clock that is not UTC', () => {
  const realTimezone = process.env.TZ

  afterEach(() => {
    if (realTimezone === undefined) delete process.env.TZ
    else process.env.TZ = realTimezone
  })

  it('stamps the day it is in Bangkok, where UTC is still yesterday', () => {
    process.env.TZ = 'Asia/Bangkok'
    const justAfterMidnight = new Date(2026, 9, 29, 0, 30)

    expect(justAfterMidnight.toISOString()).toBe('2026-10-28T17:30:00.000Z')
    expect(dateStamp(justAfterMidnight)).toBe('20261029')
  })

  it('stamps the day it is west of UTC, where UTC is already tomorrow', () => {
    process.env.TZ = 'America/Los_Angeles'
    const lateEvening = new Date(2026, 9, 29, 23, 30)

    expect(lateEvening.toISOString()).toBe('2026-10-30T06:30:00.000Z')
    expect(dateStamp(lateEvening)).toBe('20261029')
  })
})

describe('exportFileName', () => {
  it('names the enterprise, the product and the day', () => {
    expect(exportFileName('shawl-cotton', on(2026, 10, 29))).toBe(
      'paton-phueng-shawl-cotton-20261029.png',
    )
  })

  it('leaves a catalog id exactly as it is', () => {
    for (const id of ['handkerchief', 'leaf-plate', 'shirt-women']) {
      expect(exportFileName(id, on(2026, 10, 29))).toBe(
        `paton-phueng-${id}-20261029.png`,
      )
    }
  })

  it('tidies an id a filename could not carry', () => {
    expect(exportFileName('Shawl Cotton', on(2026, 10, 29))).toBe(
      'paton-phueng-shawl-cotton-20261029.png',
    )
    expect(exportFileName('../etc/passwd', on(2026, 10, 29))).toBe(
      'paton-phueng-etc-passwd-20261029.png',
    )
  })

  it('still names a file when the design has no product', () => {
    expect(exportFileName('', on(2026, 10, 29))).toBe(
      'paton-phueng-design-20261029.png',
    )
  })
})
