import { Prisma, type User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/errors";
import {
  invalidatePrincipalCache,
  type Principal,
} from "@/lib/auth/principal";
import { AdminAction, recordAdminAction } from "./audit";
import { issueEmailVerification } from "@/services/auth/email-verification";
import { newToken } from "@/lib/random";
import { env } from "@/lib/env";
import { getMailer } from "@/lib/mailer";

// -----------------------------------------------------------------------------
// list / detail
// -----------------------------------------------------------------------------

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  isBanned: z.coerce.boolean().optional(),
  isAdmin: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {};
  if (query.isBanned !== undefined) where.isBanned = query.isBanned;
  if (query.isAdmin !== undefined) where.isAdmin = query.isAdmin;
  if (query.q) {
    where.OR = [
      { email: { contains: query.q, mode: "insensitive" } },
      { displayName: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.before) where.createdAt = { lt: query.before };
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      timezone: true,
      isAdmin: true,
      isBanned: true,
      bannedReason: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      timezone: true,
      isAdmin: true,
      isBanned: true,
      bannedReason: true,
      emailVerifiedAt: true,
      createdAt: true,
      _count: {
        select: {
          ownedGroups: true,
          memberships: true,
          remindersCreated: true,
          completions: true,
          pokesSent: true,
          pokesReceived: true,
          pushSubscriptions: true,
        },
      },
      shieldCard: true,
    },
  });
  if (!user) throw new NotFoundError("user");
  return user;
}

// -----------------------------------------------------------------------------
// ban / unban / admin toggle
// -----------------------------------------------------------------------------

const banReasonSchema = z
  .string()
  .trim()
  .max(200, "原因最多 200 字")
  .optional();

export async function banUser(
  admin: Principal,
  userId: string,
  reason?: string,
): Promise<User> {
  if (admin.id === userId) {
    throw new BadRequestError("cannot_ban_self", "不能 ban 自己");
  }
  const parsedReason = banReasonSchema.parse(reason);
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, bannedReason: parsedReason ?? "无原因" },
  });
  invalidatePrincipalCache(userId);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.BanUser,
    targetType: "user",
    targetId: userId,
    payload: { reason: parsedReason ?? null },
  });
  return updated;
}

export async function unbanUser(
  admin: Principal,
  userId: string,
): Promise<User> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, bannedReason: null },
  });
  invalidatePrincipalCache(userId);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.UnbanUser,
    targetType: "user",
    targetId: userId,
  });
  return updated;
}

async function adminCount(): Promise<number> {
  return prisma.user.count({ where: { isAdmin: true, isBanned: false } });
}

export async function promoteToAdmin(
  admin: Principal,
  userId: string,
): Promise<User> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  if (target.isBanned) {
    throw new BadRequestError(
      "banned_cannot_be_admin",
      "请先解除封禁再提升管理员",
    );
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
  });
  invalidatePrincipalCache(userId);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.PromoteAdmin,
    targetType: "user",
    targetId: userId,
  });
  return updated;
}

export async function demoteFromAdmin(
  admin: Principal,
  userId: string,
): Promise<User> {
  if (admin.id === userId) {
    throw new BadRequestError("cannot_demote_self", "不能取消自己的管理员");
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  if (!target.isAdmin) return target;
  // Avoid leaving the system without any active admin.
  const remaining = await adminCount();
  if (remaining <= 1) {
    throw new BadRequestError(
      "last_admin",
      "至少要保留一个未封禁的管理员",
    );
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: false },
  });
  invalidatePrincipalCache(userId);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.DemoteAdmin,
    targetType: "user",
    targetId: userId,
  });
  return updated;
}

// -----------------------------------------------------------------------------
// account utilities
// -----------------------------------------------------------------------------

export async function forceVerifyEmail(
  admin: Principal,
  userId: string,
): Promise<User> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  if (target.emailVerifiedAt) return target;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.ForceVerifyEmail,
    targetType: "user",
    targetId: userId,
  });
  return updated;
}

/**
 * Issue a fresh password-reset link for a user (admin support flow).
 * The link is delivered through the same mailer used by /auth/forgot.
 */
export async function adminIssuePasswordReset(
  admin: Principal,
  userId: string,
): Promise<{ tokenExpiresAt: Date }> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  const token = newToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h, matches forgot
  const row = await prisma.passwordReset.create({
    data: { userId: target.id, token, expiresAt },
  });
  const link = `${env.baseUrl}/auth/reset?token=${encodeURIComponent(token)}`;
  await getMailer().send({
    to: target.email,
    subject: "RemindTogether 管理员发起的密码重设",
    body:
      `嗨 ${target.displayName}，\n\n` +
      `管理员为你发起了一次密码重设。点这个链接设置新密码：\n\n${link}\n\n` +
      `链接 1 小时内有效。如果你没有要求过，请忽略，或联系我们。`,
    category: "PASSWORD_RESET",
    refId: row.id,
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.IssuePasswordReset,
    targetType: "user",
    targetId: userId,
  });
  return { tokenExpiresAt: expiresAt };
}

/**
 * Re-send the email-verification link (admin convenience). Re-uses the
 * normal verification service — same token type, same expiry.
 */
export async function adminResendVerification(
  admin: Principal,
  userId: string,
): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("user");
  if (target.emailVerifiedAt) {
    throw new BadRequestError("already_verified", "用户邮箱已验证");
  }
  await issueEmailVerification(target);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.IssuePasswordReset, // reused for visibility
    targetType: "user",
    targetId: userId,
    payload: { kind: "resend_verification" },
  });
}

// -----------------------------------------------------------------------------
// guard adapter — every admin entrypoint should call requireAdmin() in route
// layer; this module just trusts that the principal handed in is admin.
// -----------------------------------------------------------------------------

export function assertAdmin(p: Principal): asserts p is Principal {
  if (!p.isAdmin) throw new ForbiddenError("admin_only");
}
