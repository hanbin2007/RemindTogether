import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Stable action verbs used in AdminLog. Add to this enum when wiring */
/** new admin operations so existing audit views stay greppable. */
export const AdminAction = {
  BanUser: "ban_user",
  UnbanUser: "unban_user",
  PromoteAdmin: "promote_admin",
  DemoteAdmin: "demote_admin",
  ForceVerifyEmail: "force_verify_email",
  IssuePasswordReset: "issue_password_reset",
  DisbandGroup: "disband_group",
  RemoveGroupMember: "remove_group_member",
  TransferGroupOwner: "transfer_group_owner",
  UndeleteReminder: "undelete_reminder",
  HardDeleteReminder: "hard_delete_reminder",
  UpdateConfig: "update_config",
  ResolveReport: "resolve_report",
  DismissReport: "dismiss_report",
  RunStreakTick: "run_streak_tick",
  RevokeInvite: "revoke_invite",
  DeletePushSubscription: "delete_push_subscription",
} as const;
export type AdminAction = (typeof AdminAction)[keyof typeof AdminAction];

export interface RecordOpts {
  adminId: string;
  action: AdminAction;
  targetType: "user" | "group" | "reminder" | "report" | "config" | "system" | "invite" | "push_subscription";
  targetId?: string | null;
  payload?: Prisma.InputJsonValue;
}

/** Append-only audit row. Never edit or delete from UI. */
export async function recordAdminAction(opts: RecordOpts): Promise<void> {
  await prisma.adminLog.create({
    data: {
      adminId: opts.adminId,
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId ?? null,
      payload: opts.payload ?? undefined,
    },
  });
}

export interface ListAuditQuery {
  limit?: number;
  /** Filter by adminId (for "what did this admin do?"). */
  adminId?: string;
  /** Filter by action verb. */
  action?: AdminAction | string;
  /** Filter by targetType. */
  targetType?: RecordOpts["targetType"];
  /** Cursor: only entries created STRICTLY before this Date. */
  before?: Date;
}

export async function listAuditLog(q: ListAuditQuery = {}) {
  return prisma.adminLog.findMany({
    where: {
      ...(q.adminId ? { adminId: q.adminId } : {}),
      ...(q.action ? { action: q.action } : {}),
      ...(q.targetType ? { targetType: q.targetType } : {}),
      ...(q.before ? { createdAt: { lt: q.before } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(q.limit ?? 50, 200),
    include: {
      admin: { select: { id: true, displayName: true, email: true } },
    },
  });
}
