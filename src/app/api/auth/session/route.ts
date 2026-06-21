import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { clearAdminSessionCookies, clearUserSessionCookies, getUserSession, hasAdminRole, setAdminSessionCookies, setUserSessionCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;

  if (!payload?.access_token || !payload?.refresh_token) {
    logger.warn('Missing access or refresh token in session API');
    return NextResponse.json({ error: "Missing access or refresh token." }, { status: 400 });
  }

  await setUserSessionCookies(payload.access_token, payload.refresh_token);

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(payload.access_token);
  if (userError || !userData.user) {
    logger.warn('Session cookie set but user lookup failed', { error: userError?.message });
    return NextResponse.json({ status: "ok", isAdmin: false, redirectTo: "/dashboard" });
  }

  const isAdmin = await hasAdminRole(userData.user);
  if (isAdmin) {
    await setAdminSessionCookies(payload.access_token, payload.refresh_token);
  }

  logger.debug('Session cookies set successfully', { isAdmin });
  return NextResponse.json({ status: "ok", isAdmin, redirectTo: isAdmin ? "/admin" : "/dashboard" });
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

  return NextResponse.json({
    authenticated: true,
    isAdmin,
    redirectTo: isAdmin ? "/admin" : "/dashboard",
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}

export async function DELETE() {
  await clearUserSessionCookies();
  await clearAdminSessionCookies();
  return NextResponse.json({ status: "ok" });
}
