# src/app

Application shell: routes, layout and providers.

Holds the router setup (`react-router-dom`), the page layout (header, language
toggle, footer) and the provider tree (i18n, editor store, error boundary).
Nothing here knows about a specific product or pattern — it only wires features
together.
