import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import { broadcast, groupRoom, RtEvent } from "@/lib/socket/broadcast";
import { AdminAction, recordAdminAction } from "./audit";

export const listRemindersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  visibility: z.enum(["PRIVATE", "GROUP"]).optional(),
  status: z.enum(["ACTIVE", "DONE", "SKIPPED"]).optional(),
  isDeleted: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
});
export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>;

export async function listAllReminders(query: ListRemindersQuery) {
  const where: Prisma.ReminderWhereInput = {};
  if (query.visibility) where.visibility = query.visibility;
  if (query.status) where.status = query.status;
  if (query.isDeleted !== undefined) where.isDeleted = query.isDeleted;
  if (query.q) where.title = { contains: query.q, mode: "insensitive" };
  if (query.before) where.createdAt = { lt: query.before };
  return prisma.reminder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    select: {
      id: true,
      title: true,
      visibility: true,
      groupId: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      creator: {
        select: { id: true, displayName: true, email: true },
      },
      group: { select: { id: true, name: true } },
    },
  });
}

/** Restore a previously soft-deleted reminder. */
export async function adminUndeleteReminder(
  admin: Principal,
  reminderId: string,
): Promise<void> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });
  if (!reminder) throw new NotFoundError("reminder");
  if (!reminder.isDeleted) return;
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { isDeleted: false },
  });
  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderCreated, {
      reminder,
      by: admin.id,
      reason: "admin_undelete",
    });
  }
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.UndeleteReminder,
    targetType: "reminder",
    targetId: reminderId,
  });
}

/**
 * Force-soft-delete a reminder (admin override; bypasses creator/owner
 * checks). Hard delete is intentionally NOT exposed — the row stays in
 * the table for audit + potential restore.
 */
export async function adminSoftDeleteReminder(
  admin: Principal,
  reminderId: string,
): Promise<void> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });
  if (!reminder) throw new NotFoundError("reminder");
  if (reminder.isDeleted) return;
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { isDeleted: true },
  });
  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderDeleted, {
      reminderId: reminder.id,
      by: admin.id,
      reason: "admin",
    });
  }
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.HardDeleteReminder,
    targetType: "reminder",
    targetId: reminderId,
  });
}
