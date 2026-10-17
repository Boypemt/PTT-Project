/**
 * The two pieces of the import script that are decisions rather than plumbing:
 * the id a file name turns into, and the seam score.
 *
 * The score is measured on hand-built pictures a few pixels wide, where what
 * the answer should be is obvious — a picture whose edges match exactly, one
 * where black meets white, one that is nothing but grain. Converting the real
 * patterns is what tests sharp.
 */
import { describe, expect, it } from 'vitest'
import { idFromFile, seamsOfRaw, seamWarns } from './importPatterns.ts'

/**
 * A picture from rows of greys, 0–255, as raw single-channel pixels — the
 * shape `sharp(…).raw()` hands over.
 */
function picture(rows: number[][]) {
  const height = rows.length
  const width = rows[0].length

  return {
    data: Buffer.from(rows.flat()),
    info: { width, height, channels: 1 },
  }
}

const seamsOf = (rows: number[][]) => {
  const { data, info } = picture(rows)

  return seamsOfRaw(data, info)
}

describe('idFromFile', () => {
  it('makes a kebab-case id out of the file name', () => {
    expect(idFromFile('Pastel stripes.png')).toBe('pastel-stripes')
    expect(idFromFile('/tmp/patterns/Untitled_Artwork 3.png')).toBe(
      'untitled-artwork-3',
    )
  })

  it('drops the punctuation an export dialog adds', () => {
    expect(idFromFile('lemons (final) v2.png')).toBe('lemons-final-v2')
    expect(idFromFile('  hearts .webp')).toBe('hearts')
  })
})

describe('seamsOfRaw', () => {
  it('scores a tile whose edges continue as no seam at all', () => {
    // Every row starts and ends on the same grey, and the top row repeats at
    // the bottom: the drawing carries on across both joins.
    const seams = seamsOf([
      [10, 200, 90, 10],
      [10, 40, 150, 10],
      [10, 90, 20, 10],
      [10, 200, 90, 10],
    ])

    expect(seams.horizontal.score).toBe(0)
    // Top and bottom rows are the same here too.
    expect(seams.vertical.score).toBe(0)
  })

  it('scores black meeting white as the worst there is', () => {
    const seams = seamsOf([
      [0, 128, 128, 255],
      [0, 128, 128, 255],
      [0, 128, 128, 255],
      [0, 128, 128, 255],
    ])

    expect(seams.horizontal.score).toBe(100)
    expect(seams.vertical.score).toBe(0)
  })

  it('finds the seam in the axis it is actually in', () => {
    const seams = seamsOf([
      [0, 0, 0, 0],
      [90, 90, 90, 90],
      [90, 90, 90, 90],
      [255, 255, 255, 255],
    ])

    expect(seams.horizontal.score).toBe(0)
    expect(seams.vertical.score).toBe(100)
  })

  it('measures the picture own grain beside the seam', () => {
    // Columns alternate black and white: neighbours are as different as
    // neighbours get, so a seam of the same size says nothing.
    const seams = seamsOf([
      [0, 255, 0, 255],
      [0, 255, 0, 255],
      [0, 255, 0, 255],
      [0, 255, 0, 255],
    ])

    expect(seams.horizontal.noise).toBe(100)
    expect(seams.horizontal.score).toBe(100)
  })
})

describe('seamWarns', () => {
  it('says nothing about edges that nearly meet', () => {
    expect(seamWarns({ score: 1.4, noise: 0.1 })).toBe(false)
  })

  it('warns where the drawing plainly stops at the edge', () => {
    expect(seamWarns({ score: 9.3, noise: 0.3 })).toBe(true)
  })

  it('stays quiet where the whole picture is that noisy', () => {
    // A grainy wash: the edges differ by as much as any two columns inside it.
    expect(seamWarns({ score: 8, noise: 7.6 })).toBe(false)
  })
})
