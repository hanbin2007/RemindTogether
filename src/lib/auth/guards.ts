import { auth } from "./config";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";
import {
  loadUserState,
  type Principal,
} from "./principal";

export type { Principal } from "./principal";
export { invalidatePrincipalCache } from "./principal";

/**
 * Resolve the current session's user; throws 401 if not signed in.
 *
 * Pulls a fresh `(isBanned, isAdmin)` from PG (cached 10 s/process) so
 * admin actions take effect within seconds even though the underlying
 * NextAuth JWT lives 30 days. Banned users are 403'd here regardless of
 * their cookie.
 */
export async function requirePrincipal(): Promise<Principal> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  const state = await loadUserState(session.user.id);
  if (state.isBanned) throw new ForbiddenError("banned");
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: state.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
}

export async function requireAdmin(): Promise<Principal> {
  const p = await requirePrincipal();
  if (!p.isAdmin) throw new ForbiddenError("admin_only");
  return p;
}
