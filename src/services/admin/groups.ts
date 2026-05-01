import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import { broadcast, groupRoom, RtEvent } from "@/lib/socket/broadcast";
import { AdminAction, recordAdminAction } from "./audit";

export const listGroupsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  isDisbanded: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
});
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

export async function listGroups(query: ListGroupsQuery) {
  const where: Prisma.GroupWhereInput = {};
  if (query.isDisbanded !== undefined) where.isDisbanded = query.isDisbanded;
  if (query.q) where.name = { contains: query.q, mode: "insensitive" };
  if (query.before) where.createdAt = { lt: query.before };
  return prisma.group.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    select: {
      id: true,
      name: true,
      coverEmoji: true,
      ownerId: true,
      isDisbanded: true,
      createdAt: true,
      owner: { select: { id: true, displayName: true, email: true } },
      _count: { select: { members: true, reminders: true } },
    },
  });
}

export async function getGroupDetail(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: { id: true, displayName: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      reminders: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          createdAt: true,
          creatorId: true,
        },
      },
      invites: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!group) throw new NotFoundError("group");
  return group;
}

/**
 * Admin override: disband ANY group regardless of owner. Recorded in
 * AdminLog with the actor's id so abuse is traceable.
 */
export async function adminDisbandGroup(
  admin: Principal,
  groupId: string,
): Promise<void> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("group");
  if (group.isDisbanded) return;
  const now = new Date();
  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: { isDisbanded: true },
    }),
    prisma.groupMember.updateMany({
      where: { groupId, leftAt: null },
      data: { leftAt: now },
    }),
  ]);
  await broadcast(groupRoom(groupId), RtEvent.GroupDisbanded, {
    by: admin.id,
    reason: "admin",
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.DisbandGroup,
    targetType: "group",
    targetId: groupId,
  });
}

export async function adminRemoveMember(
  admin: Principal,
  groupId: string,
  userId: string,
): Promise<void> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("group");
  if (group.ownerId === userId) {
    throw new BadRequestError(
      "cannot_remove_owner",
      "不能直接移除群主，请先解散或转让",
    );
  }
  const ms = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!ms || ms.leftAt) throw new NotFoundError("member");
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { leftAt: new Date() },
  });
  await broadcast(groupRoom(groupId), RtEvent.GroupMemberLeft, {
    userId,
    removedBy: admin.id,
    reason: "admin",
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.RemoveGroupMember,
    targetType: "group",
    targetId: groupId,
    payload: { userId },
  });
}

export async function adminTransferOwner(
  admin: Principal,
  groupId: string,
  newOwnerId: string,
): Promise<void> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("group");
  if (group.isDisbanded) {
    throw new BadRequestError("group_disbanded");
  }
  if (group.ownerId === newOwnerId) return;
  const newMs = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  });
  if (!newMs || newMs.leftAt) {
    throw new BadRequestError(
      "new_owner_not_member",
      "新群主必须是当前活跃成员",
    );
  }
  const oldOwnerId = group.ownerId;
  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: { ownerId: newOwnerId },
    }),
    // Demote old owner to MEMBER (still in the group), elevate new
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: oldOwnerId } },
      data: { role: "MEMBER" },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: "OWNER" },
    }),
  ]);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.TransferGroupOwner,
    targetType: "group",
    targetId: groupId,
    payload: { from: oldOwnerId, to: newOwnerId },
  });
}
