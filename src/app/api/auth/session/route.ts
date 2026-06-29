import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { clearAdminSessionCookies, clearUserSessionCookies, getUserSession, hasAdminRole, setAdminSessionCookies, setUserSessionCookies } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
  remember_me?: boolean;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;

  if (!payload?.access_token || !payload?.refresh_token) {
    logger.warn('Missing access or refresh token in session API');
    return NextResponse.json({ error: "Missing access or refresh token." }, { status: 400 });
  }

  // Set session with remember me option (30 days if remember me, otherwise session cookie)
  const maxAge = payload.remember_me ? 30 * 24 * 60 * 60 : undefined; // 30 days or session
  await setUserSessionCookies(payload.access_token, payload.refresh_token, maxAge);

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(payload.access_token);
  if (userError || !userData.user) {
    logger.warn('Session cookie set but user lookup failed', { error: userError?.message });
    return NextResponse.json({ status: "ok", isAdmin: false, redirectTo: "/dashboard" });
  }

  const isAdmin = await hasAdminRole(userData.user);
  if (isAdmin) {
    await setAdminSessionCookies(payload.access_token, payload.refresh_token, maxAge);
  }

  logger.debug('Session cookies set successfully', { isAdmin, rememberMe: payload.remember_me });
  
  const response = NextResponse.json({ status: "ok", isAdmin, redirectTo: isAdmin ? "/admin" : "/dashboard" });
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, isAdmin: false, redirectTo: "/login" });
  }

  const isAdmin = await hasAdminRole(session.user);
  if (isAdmin) {
    await setAdminSessionCookies(session.accessToken, session.refreshToken);
  }

  const response = NextResponse.json({
    authenticated: true,
    isAdmin,
    redirectTo: isAdmin ? "/admin" : "/dashboard",
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export async function DELETE() {
  await clearUserSessionCookies();
  await clearAdminSessionCookies();
  
  const response = NextResponse.json({ status: "ok" });
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
