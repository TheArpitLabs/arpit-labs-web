/**
 * Minimal next-intl config required by the development middleware.
 * See: https://next-intl.dev/docs/getting-started/app-router
 */
module.exports = {
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  // Do not prefix routes with the locale (we keep routes under `/`)
  localePrefix: {
    mode: 'never'
  }
};
