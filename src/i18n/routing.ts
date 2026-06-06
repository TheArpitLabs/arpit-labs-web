import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'hi'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Do not prefix routes with the locale (we keep routes under `/`)
  localePrefix: {
    mode: 'never'
  }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
