"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "./types";

async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");
  const data = await res.json();
  return data.user ?? null;
}

/** Client hook exposing the current authenticated user. */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
