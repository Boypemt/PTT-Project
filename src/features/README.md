# src/features

Page-level features, one folder each: `landing`, `product-picker`, `export`, …

A feature owns the composition of a page or a large panel and may read the
catalog and the editor store. Shared, reusable pieces move down into
[`src/components`](../components/README.md); reusable logic moves into
[`src/lib`](../lib/README.md).
