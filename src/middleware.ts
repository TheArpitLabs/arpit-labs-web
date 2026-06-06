import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAccessCookieName } from "@/lib/auth-constants";
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Auth Logic
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasAccessToken = Boolean(request.cookies.get(adminAccessCookieName)?.value);
    if (!hasAccessToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Multi-language (i18n) Logic for public routes
  // We exclude admin routes from i18n for simplicity in CMS
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Don't run the i18n middleware for the root path to avoid automatic
  // redirects to locale-prefixed routes which aren't present in the app
  if (pathname === '/') {
    return NextResponse.next();
  }

  // If the app uses unprefixed routes, strip locale prefixes and redirect
  // so requests to `/en` or `/en/...` map to the existing routes.
  const localePrefixMatch = pathname.match(/^\/(en|hi)(?:\/|$)/);
  if (localePrefixMatch) {
    const newPath = pathname.replace(/^\/(en|hi)/, '') || '/';
    const redirectUrl = new URL(newPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Note: locale routing is handled by `next-intl` middleware for other paths
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
