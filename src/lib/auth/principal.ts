/**
 * Principal type + state cache. Lives in its own module (no NextAuth
 * imports) so service code can pull `Principal` and the cache helpers
 * without dragging the auth runtime — that matters for vitest's Node
 * environment where next-auth's `next/server` peer resolution breaks.
 */
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/api/errors";

export interface Principal {
  id: string;
  email: string;
  isAdmin: boolean;
  emailIsVerified: boolean;
}

export interface CachedUserState {
  isBanned: boolean;
  isAdmin: boolean;
  fetchedAt: number;
}

/**
 * Cache TTL is 10 s in production (saves DB queries on hot paths) and
 * 0 elsewhere — dev/test always reads fresh so admin actions made via
 * direct SQL or test fixtures take effect immediately. `RT_PRINCIPAL_CACHE_TTL`
 * lets ops force a different number when they want the perf knob.
 */
export const STATE_TTL_MS = (() => {
  const override = process.env.RT_PRINCIPAL_CACHE_TTL;
  if (override !== undefined) return Math.max(0, Number.parseInt(override, 10) || 0);
  return process.env.NODE_ENV === "production" ? 10_000 : 0;
})();
const userStateCache = new Map<string, CachedUserState>();

export async function loadUserState(userId: string): Promise<CachedUserState> {
  const cached = userStateCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < STATE_TTL_MS) return cached;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, isAdmin: true },
  });
  if (!row) {
    userStateCache.delete(userId);
    throw new UnauthorizedError();
  }
  const next: CachedUserState = {
    isBanned: row.isBanned,
    isAdmin: row.isAdmin,
    fetchedAt: Date.now(),
  };
  userStateCache.set(userId, next);
  return next;
}

/** Invalidate a single user (or the whole cache when no id given). */
export function invalidatePrincipalCache(userId?: string): void {
  if (userId) userStateCache.delete(userId);
  else userStateCache.clear();
}
