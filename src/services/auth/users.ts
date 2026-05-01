import { Prisma, type User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/password";
import { ConfigKey, getConfigBool } from "@/services/config";
import { issueEmailVerification } from "./email-verification";

const emailField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().email("邮箱格式不对").max(254),
);

const displayNameField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1, "显示名不能为空").max(40, "显示名最多 40 个字符"),
);

export const signupInputSchema = z.object({
  email: emailField,
  password: passwordSchema,
  displayName: displayNameField,
  timezone: z.string().max(60).optional(),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export class EmailAlreadyRegistered extends Error {
  constructor() {
    super("EMAIL_ALREADY_REGISTERED");
    this.name = "EmailAlreadyRegistered";
  }
}

export async function createUser(rawInput: SignupInput): Promise<User> {
  // Re-run the schema so the `.transform(...)` normalisations (lower-case
  // email, trim, etc.) apply even when callers bypass the form layer
  // (e.g. tests, scripts).
  const input = signupInputSchema.parse(rawInput);
  const passwordHash = await hashPassword(input.password);

  // Email verification is gated on a runtime flag the admin backend can
  // flip. When the flag is OFF (default), we mark the new user verified
  // immediately and skip the mail entirely. When it's ON, we behave like
  // standard email-verify: emailVerifiedAt stays null and a token is
  // issued + a mail goes out.
  const requireVerification = await getConfigBool(
    ConfigKey.RequireEmailVerification,
  );

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        timezone: input.timezone || "UTC",
        emailVerifiedAt: requireVerification ? null : new Date(),
      },
    });
    if (requireVerification) {
      // Fire-and-await: we want the verification mail to land in MailLog
      // before we return so callers (and tests) can immediately read it.
      await issueEmailVerification(user);
    }
    return user;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new EmailAlreadyRegistered();
    }
    throw e;
  }
}

export const credentialsInputSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(256),
});

export type CredentialsInput = z.infer<typeof credentialsInputSchema>;

export type AuthenticatedPrincipal = Pick<
  User,
  "id" | "email" | "displayName" | "isAdmin" | "emailVerifiedAt" | "isBanned"
>;

/**
 * Verify email + password. Returns the user when credentials match AND the
 * account is not banned. Email verification is NOT enforced here; the UI
 * decides what to do with an unverified user (we still let them in but show
 * a banner — see Phase 2 design).
 */
export async function verifyCredentials(
  rawInput: CredentialsInput,
): Promise<AuthenticatedPrincipal | null> {
  const input = credentialsInputSchema.parse(rawInput);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return null;
  if (user.isBanned) return null;
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    emailVerifiedAt: user.emailVerifiedAt,
    isBanned: user.isBanned,
  };
}
