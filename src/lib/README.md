# src/lib

Pure helpers with unit tests: canvas geometry, price calculation, design
serialization, share/export link building, id generation, and the feature
flags (`flags.ts`) that keep unfinished work out of Production.

No React, no DOM, no network — functions in and out, so Vitest can cover them
directly. Each module here should have a sibling `*.test.ts`.
