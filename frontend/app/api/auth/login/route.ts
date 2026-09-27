import { NextRequest, NextResponse } from "next/server";
import { STRAPI_URL, AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/config";
import { sanitizeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * BFF login: exchanges credentials for a Strapi JWT, stores it in an httpOnly
 * cookie, and returns a sanitized user profile. The JWT is never exposed to
 * client JS (see IMPLEMENTATION_PLAN §6, §11.C).
 */
export async function POST(req: NextRequest) {
  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { identifier, password } = body;
  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Email/username and password are required." },
      { status: 400 }
    );
  }

  // 1. Authenticate against Strapi.
  const loginRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
    cache: "no-store",
  });

  const loginData = await loginRes.json().catch(() => null);

  if (!loginRes.ok || !loginData?.jwt) {
    const message =
      loginData?.error?.message ?? "Invalid credentials or inactive account.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const jwt: string = loginData.jwt;

  // 2. Fetch the full profile (role + avatar) which /auth/local does not populate.
  const meRes = await fetch(
    `${STRAPI_URL}/api/users/me?populate[role]=true&populate[avatar]=true`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    }
  );
  const meData = await meRes.json().catch(() => null);
  const user = sanitizeUser(meRes.ok ? meData : loginData.user);

  // 3. Set the httpOnly cookie and return the sanitized user.
  const res = NextResponse.json({ user });
  res.cookies.set(AUTH_COOKIE, jwt, AUTH_COOKIE_OPTIONS);
  return res;
}
