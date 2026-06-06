import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAccessCookieName } from "@/lib/auth-constants";

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

  // 2. Skip middleware for API routes, static files, and admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 3. Handle locale-prefixed routes - redirect to non-prefixed (for backward compatibility)
  const localePrefixMatch = pathname.match(/^\/(en|hi)(?:\/|$)/);
  if (localePrefixMatch) {
    const newPath = pathname.replace(/^\/(en|hi)/, '') || '/';
    const redirectUrl = new URL(newPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Allow all other routes to pass through without locale prefixing
  return NextResponse.next();
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
