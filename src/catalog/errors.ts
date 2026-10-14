/**
 * The one error the catalog throws. Its message is read by whoever edits the
 * JSON — the designer dropping in real patterns — so it always names the file
 * and, for each problem, the offending item and the path inside it.
 */

/** Keep long failure lists readable; `problems` still holds every one. */
const MAX_LISTED_PROBLEMS = 10

export class CatalogError extends Error {
  /** The catalog file the problems are in, e.g. `patterns.json`. */
  readonly file: string
  /** One line per problem, each naming the item and the path inside it. */
  readonly problems: string[]

  constructor(file: string, problems: string[], options?: ErrorOptions) {
    const listed = problems.slice(0, MAX_LISTED_PROBLEMS)
    const hidden = problems.length - listed.length
    const lines = [
      `${file}: ${problems.length === 1 ? '1 problem' : `${problems.length} problems`}`,
      ...listed.map((problem) => `  - ${problem}`),
      ...(hidden > 0 ? [`  - (+${hidden} more)`] : []),
    ]

    super(lines.join('\n'), options)
    this.name = 'CatalogError'
    this.file = file
    this.problems = problems
  }
}
