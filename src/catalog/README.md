# src/catalog

The only way the app reads catalog data.

- `types.ts` — the domain model (`Product`, `Pattern`, `LeafDye`, `PrintArea`,
  `Layer`, `Design`) as defined in `docs/PROJECT_BRIEF.md`.
- zod schemas + loaders that fetch and validate `public/catalog/*.json`.
- hooks that expose the validated catalog to components.

Golden rule from `CLAUDE.md`: products, patterns and leaf dyes are **data**.
Components never import or hardcode a specific entry — they go through here.
Invalid data must fail loudly, naming the file and the offending entry id.
