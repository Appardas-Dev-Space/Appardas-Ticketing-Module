import { NextRequest, NextResponse } from "next/server";
import { STRAPI_URL, AUTH_COOKIE } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Catch-all BFF proxy: forwards client `/api/*` calls to the Strapi backend
 * with the JWT (read from the httpOnly cookie) attached server-side.
 *
 * The dedicated `/api/auth/*` route handlers take precedence over this
 * catch-all, so authentication endpoints are never proxied here.
 *
 * Client JS therefore never touches the raw JWT (see IMPLEMENTATION_PLAN §6).
 */
async function handler(
  req: NextRequest,
  ctx: { params: { proxy?: string[] } }
) {
  const segments = ctx.params.proxy ?? [];
  const search = req.nextUrl.search;
  const target = `${STRAPI_URL}/api/${segments.join("/")}${search}`;

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };
  if (hasBody) {
    // Forward the raw body untouched (JSON, form-data serialized upstream, etc.).
    init.body = await req.arrayBuffer();
  }

  const backendRes = await fetch(target, init);

  const resContentType =
    backendRes.headers.get("content-type") ?? "application/json";
  const bodyBuffer = await backendRes.arrayBuffer();

  return new NextResponse(bodyBuffer, {
    status: backendRes.status,
    headers: { "content-type": resContentType },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
