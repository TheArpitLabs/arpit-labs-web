import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAccessCookieName, userAccessCookieName } from "@/lib/auth-constants";
import { createClient } from "@supabase/supabase-js";
import { getUserRole } from "@/lib/auth/admin";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      console.error('Middleware auth error:', error);
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
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

  // 3. Skip middleware for API routes, static files, and admin routes
  if (pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 4. Handle locale-prefixed routes - redirect to non-prefixed (for backward compatibility)
  const localePrefixMatch = pathname.match(/^\/(en|hi)(?:\/|$)/);
  if (localePrefixMatch) {
    const newPath = pathname.replace(/^\/(en|hi)/, '') || '/';
    const redirectUrl = new URL(newPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Allow all other routes to pass through without locale prefixing
  return NextResponse.next();
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
  // Run middleware in Node.js runtime instead of Edge Runtime to avoid Supabase compatibility issues
  runtime: 'nodejs',
};
