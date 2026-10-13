/**
 * Conventional Commits, with the scope list from CLAUDE.md.
 * Example: feat(editor): add pattern scale slider
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'catalog',
        'editor',
        'ui',
        'i18n',
        'export',
        'ci',
        'deps',
        'docs',
      ],
    ],
  },
}
