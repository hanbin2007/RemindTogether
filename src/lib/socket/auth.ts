import { getToken } from "next-auth/jwt";
import type { IncomingHttpHeaders } from "node:http";

/**
 * Decode the NextAuth session cookie attached to a Socket.io handshake.
 * Returns the bare token (with our `sub` + `isAdmin` claims) or null when
 * the request is anonymous or the signature is invalid.
 *
 * NextAuth v5 beta exposes `getToken` at `next-auth/jwt`; we hand it a
 * minimal Request-shaped object built from the raw Node headers.
 */
export async function tokenFromHandshake(
  headers: IncomingHttpHeaders,
): Promise<{ userId: string; isAdmin: boolean } | null> {
  const cookie = headers.cookie ?? "";
  if (!cookie) return null;

  const token = await getToken({
    req: { headers: { cookie } } as never,
    secret: process.env.AUTH_SECRET ?? "",
    secureCookie:
      cookie.includes("__Secure-authjs.session-token") ||
      cookie.includes("__Host-authjs.session-token"),
  });
  if (!token || !token.sub) return null;
  return {
    userId: token.sub,
    isAdmin: typeof token.isAdmin === "boolean" ? token.isAdmin : false,
  };
}
