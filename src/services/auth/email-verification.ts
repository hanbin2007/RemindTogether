import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getMailer } from "@/lib/mailer";
import { newToken } from "@/lib/random";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export async function issueEmailVerification(user: Pick<User, "id" | "email" | "displayName">) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  const row = await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const link = `${env.baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
  await getMailer().send({
    to: user.email,
    subject: "验证你的 RemindTogether 邮箱",
    body:
      `嗨 ${user.displayName}，\n\n` +
      `欢迎来到 RemindTogether。请点击下面的链接完成邮箱验证：\n\n` +
      `${link}\n\n` +
      `链接 24 小时内有效。如果不是你本人操作，忽略此邮件即可。`,
    category: "EMAIL_VERIFICATION",
    refId: row.id,
  });

  return { id: row.id, token, expiresAt };
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "used" };

export async function consumeEmailVerification(token: string): Promise<ConsumeResult> {
  const row = await prisma.emailVerification.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const now = new Date();
  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: row.id },
      data: { usedAt: now },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: now },
    }),
  ]);

  return { ok: true, userId: row.userId };
}
