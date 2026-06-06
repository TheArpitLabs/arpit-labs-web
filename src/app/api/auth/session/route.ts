import { NextResponse } from "next/server";
import { setUserSessionCookies, clearUserSessionCookies } from "@/lib/auth";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;

  console.log('[/api/auth/session POST] Received payload:', {
    hasAccessToken: !!payload?.access_token,
    hasRefreshToken: !!payload?.refresh_token,
  });

  if (!payload?.access_token || !payload?.refresh_token) {
    console.log('[/api/auth/session POST] Missing tokens, returning 400');
    return NextResponse.json({ error: "Missing access or refresh token." }, { status: 400 });
  }

  await setUserSessionCookies(payload.access_token, payload.refresh_token);
  console.log('[/api/auth/session POST] Session cookies set successfully');
  return NextResponse.json({ status: "ok" });
}

export async function DELETE() {
  await clearUserSessionCookies();
  return NextResponse.json({ status: "ok" });
}
