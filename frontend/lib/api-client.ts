/**
 * Thin client-side fetch wrapper that talks to the BFF proxy (same-origin).
 * The proxy attaches the JWT server-side, so callers never handle tokens.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = data as { error?: { message?: string } | string } | null;
    const raw =
      typeof err?.error === "object" ? err?.error?.message : err?.error;
    const message = raw ?? `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return data as T;
}
