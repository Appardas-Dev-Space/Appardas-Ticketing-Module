import type { SessionUser } from "./types";

interface RawStrapiUser {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  displayName?: string | null;
  title?: string | null;
  isActive?: boolean;
  role?: { id: number; name: string; type: string } | null;
  avatar?: { id: number; url: string; name?: string } | null;
}

/**
 * Reduce a raw Strapi user object to the safe, client-facing session shape.
 * Never forwards password hashes, tokens, provider, etc.
 */
export function sanitizeUser(
  raw: RawStrapiUser | null | undefined
): SessionUser | null {
  if (!raw) return null;
  return {
    id: raw.id,
    documentId: raw.documentId,
    username: raw.username,
    email: raw.email,
    displayName: raw.displayName ?? null,
    title: raw.title ?? null,
    isActive: raw.isActive ?? true,
    role: raw.role
      ? { id: raw.role.id, name: raw.role.name, type: raw.role.type }
      : null,
    avatar: raw.avatar
      ? { id: raw.avatar.id, url: raw.avatar.url, name: raw.avatar.name }
      : null,
  };
}
