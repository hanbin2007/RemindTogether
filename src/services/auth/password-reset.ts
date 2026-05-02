import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getMailer } from "@/lib/mailer";
import { newToken } from "@/lib/random";
import { hashPassword, passwordSchema } from "@/lib/password";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 h

export const requestResetSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email().max(254),
  ),
});

/**
 * Always resolves to ok — we don't reveal whether an email is registered,
 * to prevent account enumeration. If the email is registered, an email
 * with a reset link goes out.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silently swallow

  const token = newToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  const row = await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const link = `${env.baseUrl}/auth/reset?token=${encodeURIComponent(token)}`;
  await getMailer().send({
    to: user.email,
    subject: "重设你的 RemindTogether 密码",
    body:
      `嗨 ${user.displayName}，\n\n` +
      `我们收到了重设密码的请求。点这个链接设置新密码：\n\n` +
      `${link}\n\n` +
      `链接 1 小时内有效。如果不是你本人操作，忽略此邮件即可。`,
    category: "PASSWORD_RESET",
    refId: row.id,
  });
}

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export type ConsumeResetResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "used" };

export async function consumePasswordReset(
  token: string,
  newPassword: string,
): Promise<ConsumeResetResult> {
  const row = await prisma.passwordReset.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: row.id },
      data: { usedAt: now },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    // Belt-and-braces: invalidate any other outstanding reset tokens for
    // the user so an old leaked link can't be used after a successful
    // reset.
    prisma.passwordReset.updateMany({
      where: {
        userId: row.userId,
        usedAt: null,
        id: { not: row.id },
      },
      data: { usedAt: now },
    }),
  ]);

  return { ok: true, userId: row.userId };
}
