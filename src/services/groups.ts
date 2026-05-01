import { Prisma, type Group, type GroupMember } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import {
  consumeInvite,
  type ConsumeInviteResult,
  issueGroupInvite,
} from "@/services/auth/invites";
import { ConfigKey, getConfigInt } from "@/services/config";

export const createGroupInputSchema = z.object({
  name: z.string().trim().min(1, "群名不能为空").max(40, "群名最多 40 字"),
  coverEmoji: z
    .string()
    .trim()
    .max(8, "封面 emoji 太长")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});
export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

export const updateGroupInputSchema = createGroupInputSchema.partial();
export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

export interface GroupWithMembership extends Group {
  members: Array<{
    userId: string;
    role: GroupMember["role"];
    joinedAt: Date;
    leftAt: Date | null;
    user: { id: string; displayName: string; avatarUrl: string | null };
  }>;
  memberCount: number;
}

/**
 * Throws ForbiddenError if the user is not an active (non-left) member of
 * the group, or NotFoundError if the group itself is missing or
 * disbanded. Returns the membership row so callers can use the role.
 */
export async function assertActiveGroupMember(
  userId: string,
  groupId: string,
): Promise<GroupMember> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.isDisbanded) throw new NotFoundError("group");
  const ms = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!ms || ms.leftAt) throw new ForbiddenError("not_a_member");
  return ms;
}

async function assertOwner(userId: string, groupId: string): Promise<void> {
  const ms = await assertActiveGroupMember(userId, groupId);
  if (ms.role !== "OWNER") throw new ForbiddenError("owner_only");
}

export async function createGroup(
  principal: Principal,
  input: CreateGroupInput,
): Promise<Group> {
  return prisma.group.create({
    data: {
      name: input.name,
      coverEmoji: input.coverEmoji ?? null,
      ownerId: principal.id,
      members: { create: { userId: principal.id, role: "OWNER" } },
    },
  });
}

export async function listMyGroups(principal: Principal): Promise<Group[]> {
  return prisma.group.findMany({
    where: {
      isDisbanded: false,
      members: {
        some: { userId: principal.id, leftAt: null },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGroup(
  principal: Principal,
  id: string,
): Promise<GroupWithMembership> {
  await assertActiveGroupMember(principal.id, id);
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!group) throw new NotFoundError("group");
  return { ...group, memberCount: group.members.length };
}

export async function updateGroup(
  principal: Principal,
  id: string,
  input: UpdateGroupInput,
): Promise<Group> {
  if (Object.keys(input).length === 0) {
    throw new BadRequestError("empty_update", "什么都没改");
  }
  await assertOwner(principal.id, id);
  return prisma.group.update({ where: { id }, data: input });
}

export async function removeMember(
  principal: Principal,
  groupId: string,
  targetUserId: string,
): Promise<void> {
  await assertOwner(principal.id, groupId);
  if (principal.id === targetUserId) {
    throw new BadRequestError(
      "cannot_remove_self",
      "群主请用解散，不要移除自己",
    );
  }
  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target || target.leftAt) throw new NotFoundError("member");
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { leftAt: new Date() },
  });
}

export async function leaveGroup(
  principal: Principal,
  groupId: string,
): Promise<void> {
  const ms = await assertActiveGroupMember(principal.id, groupId);
  if (ms.role === "OWNER") {
    throw new BadRequestError(
      "owner_must_disband",
      "群主不能直接退群，请先解散或转让",
    );
  }
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: principal.id } },
    data: { leftAt: new Date() },
  });
}

export async function disbandGroup(
  principal: Principal,
  groupId: string,
): Promise<void> {
  await assertOwner(principal.id, groupId);
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
}

export interface IssueInviteResult {
  token: string;
  expiresAt: Date;
  url: string;
}

export async function issueInviteForGroup(
  principal: Principal,
  groupId: string,
  baseUrl: string,
): Promise<IssueInviteResult> {
  await assertActiveGroupMember(principal.id, groupId);
  const r = await issueGroupInvite(groupId, principal.id);
  return {
    token: r.token,
    expiresAt: r.expiresAt,
    url: `${baseUrl.replace(/\/$/, "")}/invite/${encodeURIComponent(r.token)}`,
  };
}

/**
 * Join a group via an invite token. Caller must already be authenticated.
 * Honors the group max-members ceiling configured by the admin.
 */
export async function joinGroupByToken(
  principal: Principal,
  token: string,
): Promise<ConsumeInviteResult> {
  // Enforce capacity before consuming the token.
  // (We keep this in the service rather than the invite layer so other
  // join paths — eventually OAuth, deep-link sharing, etc. — see the same
  // ceiling.)
  const inviteRow = await prisma.inviteToken.findUnique({
    where: { token },
    select: { groupId: true },
  });
  if (inviteRow) {
    const cap = await getConfigInt(ConfigKey.GroupMaxMembers);
    const active = await prisma.groupMember.count({
      where: { groupId: inviteRow.groupId, leftAt: null },
    });
    const alreadyMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: inviteRow.groupId, userId: principal.id },
      },
      select: { leftAt: true },
    });
    const willAdd = !alreadyMember || alreadyMember.leftAt !== null;
    if (willAdd && active >= cap) {
      throw new BadRequestError("group_full", "群人数已满");
    }
  }
  return consumeInvite(token, principal.id);
}

// Re-export for callers (e.g. test fixtures) that prefer to construct
// invites directly without going through assertActiveGroupMember.
export { issueGroupInvite } from "@/services/auth/invites";

// Sentinel used in tests + storybook scenarios:
export const GROUPS_SERVICE_VERSION = 1 as const;

// Help TypeScript infer types of update inputs even when callers omit
// fields that aren't part of the partial schema (e.g. ownerId is never
// part of the public update surface).
export type GroupUpdateData = Prisma.GroupUpdateInput;
