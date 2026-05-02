import { randomBytes } from "node:crypto";

/**
 * URL-safe random token. Default 32 bytes ⇒ 43-char base64url.
 *
 * Tokens are used for email verification, password reset, and group
 * invites — always single-use and short-lived.
 */
export function newToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}
