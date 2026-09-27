import { NextRequest, NextResponse } from "next/server";
import { STRAPI_URL, AUTH_COOKIE } from "@/lib/config";
import { sanitizeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 *
 * Returns the current user's profile by reading the httpOnly JWT cookie and
 * calling Strapi's `/users/me`. Responds 401 when unauthenticated.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meRes = await fetch(
    `${STRAPI_URL}/api/users/me?populate[role]=true&populate[avatar]=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!meRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meData = await meRes.json().catch(() => null);
  return NextResponse.json({ user: sanitizeUser(meData) });
}
