# public/catalog

The catalog, served as static files and validated with zod at load time.

```
products.json     product definitions, mockups and print areas
patterns.json     patterns (tiles and motifs)
leaf-dyes.json    the community's leaf dye colours
products/         product mockup images (base + optional shading overlay)
patterns/         pattern SVG/PNG files and thumbnails
```

Every file has the same root shape, so a version bump can be detected:

```json
{ "catalogVersion": 1, "items": [...] }
```

Ids are lowercase kebab-case, colours are hex (`#4B2A4F`), and asset paths are
absolute under `/catalog/`. Unknown keys are rejected, so a typo fails the load
with a message naming the file, the entry id and the field.

Placeholder entries carry `"source": { "type": "placeholder", … }` so they can
be filtered or swapped for the designer's real patterns later **without code
changes**. Record every third-party asset in `docs/CREDITS.md`.
