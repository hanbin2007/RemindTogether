import bcrypt from "bcryptjs";
import { z } from "zod";

/**
 * Password policy
 * - Minimum 8 chars (PRD does not pin a number; 8 is the OWASP/NIST baseline)
 * - At most 256 chars (avoid bcrypt's 72-byte truncation surprise by using
 *   a generous outer bound; we also tell users the rule below)
 * - Must contain at least one letter and one digit; symbols allowed
 *
 * NOTE: bcrypt itself only hashes the first 72 BYTES of input. The
 * encouraging-rather-than-nagging design lets users pick what they want,
 * but to keep the hash deterministic we trim before hashing in
 * {@link hashPassword}.
 */
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(256, "密码太长，最多 256 个字符")
  .refine((s) => /[A-Za-z]/.test(s), "密码必须包含至少一个字母")
  .refine((s) => /\d/.test(s), "密码必须包含至少一个数字");

const BCRYPT_INPUT_MAX_BYTES = 72;
const BCRYPT_COST = 12; // PRD architecture says cost 12

/** Truncate the input to bcrypt's 72-byte ceiling. */
function clampForBcrypt(input: string): string {
  const buf = Buffer.from(input, "utf8");
  if (buf.byteLength <= BCRYPT_INPUT_MAX_BYTES) return input;
  // Decode the head while preserving valid UTF-8 boundaries.
  return buf.slice(0, BCRYPT_INPUT_MAX_BYTES).toString("utf8");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(clampForBcrypt(plain), BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(clampForBcrypt(plain), hash);
}
