import { auth } from "./config";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";

export interface Principal {
  id: string;
  email: string;
  isAdmin: boolean;
  emailIsVerified: boolean;
}

/** Resolve the current session's user; throws 401 if not signed in. */
export async function requirePrincipal(): Promise<Principal> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
}

/** Resolve principal AND require admin; throws 401/403. */
export async function requireAdmin(): Promise<Principal> {
  const p = await requirePrincipal();
  if (!p.isAdmin) throw new ForbiddenError("admin_only");
  return p;
}
