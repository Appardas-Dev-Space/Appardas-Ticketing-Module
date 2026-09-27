import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/config";

const PROTECTED_PREFIXES = ["/board", "/tickets", "/members", "/dashboard"];
const AUTH_ROUTES = ["/login"];

/**
 * Route guard.
 *  - Protected app routes require the `token` cookie; otherwise redirect to /login.
 *  - The /login route redirects to /board when already authenticated.
 *
 * This is a coarse presence check only; the BFF/Strapi enforce real authz.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(AUTH_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isProtected && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/board";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/board/:path*", "/tickets/:path*", "/members/:path*", "/dashboard/:path*", "/login"],
};
