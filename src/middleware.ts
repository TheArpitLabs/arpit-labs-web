import { NextResponse, type NextRequest } from "next/server";
import { adminAccessCookieName, userAccessCookieName } from "@/lib/auth/auth-constants";
import { createClient } from "@supabase/supabase-js";
import { getUserRole } from "@/lib/auth/admin";
import { logger } from '@/lib/logger';
import { validateCSRFToken } from '@/lib/csrf';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://*.supabase.co https://*.githubusercontent.com https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co https://api.stripe.com https://github.com; frame-src 'self' https://js.stripe.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;"
  );

  // Strict Transport Security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 1. Admin Auth Logic - verify admin role, not just token presence
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const accessToken = request.cookies.get(adminAccessCookieName)?.value;
    if (!accessToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify admin role by checking the user's profile
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const role = await getUserRole(user.id);
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      // Log error but redirect to login on any failure
      logger.error('Middleware auth error:', error);
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // 2. Redirect admin users from /dashboard to /admin
  if (pathname.startsWith("/dashboard")) {
    const userAccessToken = request.cookies.get(userAccessCookieName)?.value;
    if (userAccessToken) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: { user }, error } = await supabase.auth.getUser(userAccessToken);

          if (!error && user) {
            const role = await getUserRole(user.id);
            if (role === "admin") {
              return NextResponse.redirect(new URL("/admin", request.url));
            }
          }
        }
      } catch (error) {
        // If role check fails, allow access to dashboard
      }
    }
  }

  // 3. CSRF Protection for API routes
  if (pathname.startsWith("/api")) {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return response;
    }

    // Skip CSRF for the csrf endpoint itself
    if (pathname === "/api/csrf") {
      return response;
    }

    // Validate CSRF token for state-changing methods
    const csrfToken = request.headers.get('x-csrf-token');
    const isValid = await validateCSRFToken(csrfToken);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return response;
  }

  // 4. Skip middleware for static files
  if (pathname.includes(".")) {
    return response;
  }

  // 5. Handle locale-prefixed routes - redirect to non-prefixed (for backward compatibility)
  const localePrefixMatch = pathname.match(/^\/(en|hi)(?:\/|$)/);
  if (localePrefixMatch) {
    const newPath = pathname.replace(/^\/(en|hi)/, '') || '/';
    const redirectUrl = new URL(newPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Allow all other routes to pass through without locale prefixing
  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
  // Run middleware in Node.js runtime instead of Edge Runtime to avoid Supabase compatibility issues
  runtime: 'nodejs',
};
