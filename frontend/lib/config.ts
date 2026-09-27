/**
 * Server-side configuration for the BFF layer.
 *
 * These values are only read inside Route Handlers / middleware and must never
 * be shipped to the client bundle (no `NEXT_PUBLIC_` prefix).
 */

/** Base URL of the Strapi backend. */
export const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

/** Name of the httpOnly cookie that stores the Strapi JWT. */
export const AUTH_COOKIE = "token";

/** Cookie options shared by the auth route handlers (see IMPLEMENTATION_PLAN §11.C). */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  // Secure requires HTTPS; disabled in local dev so the cookie works over http.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
