Read CLAUDE.md. Branch: `feat/app-shell-i18n`.

1. react-router-dom routes: `/` (landing placeholder), `/products` (picker placeholder), `/customize/:productId` (editor placeholder), `/dev/catalog` (move the dev page here if it exists; only in dev builds), 404 page.
2. Layout: header with logo text "ป่าต้นผึ้ง · Pa Ton Phueng", nav (Home, Products), language toggle TH/EN; footer with community address and "Prototype by Enactus" note. Mobile hamburger menu.
3. react-i18next: `src/i18n/th.json` + `en.json`, Thai default, language saved to localStorage, `<html lang>` updated. Helper `useLocalized()` to pick `Localized` fields from catalog data by current language.
4. Wrap app in CatalogProvider; show friendly loading and error states (error state shows the CatalogError message in a readable box — useful for the designer).
5. Tests: language toggle switches text and persists; useLocalized returns the right field; unknown route shows 404.

Commit plan:
- feat(app): add router and route placeholders
- feat(ui): add layout with header and footer
- feat(i18n): add i18next with thai and english
- feat(i18n): add language toggle and useLocalized
- feat(app): add catalog loading and error states
- test(app): cover routing and i18n

Push and open PR.
