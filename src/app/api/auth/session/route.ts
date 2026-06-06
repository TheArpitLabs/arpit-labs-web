import { NextResponse } from "next/server";
import { setUserSessionCookies, clearUserSessionCookies } from "@/lib/auth";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;

  if (!payload?.access_token || !payload?.refresh_token) {
    return NextResponse.json({ error: "Missing access or refresh token." }, { status: 400 });
  }

  await setUserSessionCookies(payload.access_token, payload.refresh_token);
  return NextResponse.json({ status: "ok" });
}

export async function DELETE() {
  await clearUserSessionCookies();
  return NextResponse.json({ status: "ok" });
}
