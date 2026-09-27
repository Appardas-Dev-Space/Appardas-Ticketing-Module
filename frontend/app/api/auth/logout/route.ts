import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly JWT cookie.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
