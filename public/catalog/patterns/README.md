# public/catalog/patterns

Pattern files referenced from `patterns.json` as `src` and `thumbnail`.

SVG is preferred: a recolorable pattern uses `fill="currentColor"` or CSS
variables so leaf-dye colours can tint it. `kind: "tile"` files must repeat
seamlessly; `kind: "motif"` files are single placeable elements such as one
leaf. Placeholder files drawn for the prototype live here until the designer's
patterns replace them.

## Recolouring convention

The placeholder files take their colours from CSS variables with the entry's
`defaultColors` baked in as the fallback:

```svg
<path d="…" fill="var(--c1, #4b2a4f)" />
<path d="…" stroke="var(--c2, #a98fae)" />
```

`--c1` is the main ink and `--c2` the secondary (veins, highlights, second
stripe); `defaultColors[0]` and `[1]` in `patterns.json` hold the same values.
Inline the SVG and set the variables to recolour it; load it as an `<img>` or a
canvas image and it falls back to the default leaf-dye colours.

## Seamless tiles

A tile's viewBox **is** the repeat unit. Where artwork crosses the edge of the
unit, the file draws it nine times — offset by ±one unit in each direction —
inside a `clipPath` of the unit, so whatever leaves one edge comes back on the
opposite one and the tile has no seam.
