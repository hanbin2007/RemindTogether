import { Prisma, type Group, type GroupMember } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import {
  consumeInvite,
  type ConsumeInviteResult,
  issueGroupInvite,
} from "@/services/auth/invites";
import { ConfigKey, getConfigInt } from "@/services/config";
import { broadcast, groupRoom, RtEvent } from "@/lib/socket/broadcast";
import { emitNotification, emitNotificationMany } from "@/services/notifications";

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
  await broadcast(groupRoom(groupId), RtEvent.GroupMemberLeft, {
    userId: targetUserId,
    removedBy: principal.id,
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
  await broadcast(groupRoom(groupId), RtEvent.GroupMemberLeft, {
    userId: principal.id,
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
  await broadcast(groupRoom(groupId), RtEvent.GroupDisbanded, {
    by: principal.id,
  });
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
  const result = await consumeInvite(token, principal.id);
  if (result.ok && !result.alreadyMember) {
    // Pull a tiny user payload for the broadcast so listeners don't need
    // to re-query the user themselves.
    const user = await prisma.user.findUnique({
      where: { id: principal.id },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    await broadcast(groupRoom(result.groupId), RtEvent.GroupMemberJoined, {
      user,
    });
    // Notify everyone already in the group + tell the joiner themselves.
    const group = await prisma.group.findUnique({
      where: { id: result.groupId },
      select: { name: true, ownerId: true },
    });
    if (group) {
      const peers = await prisma.groupMember.findMany({
        where: { groupId: result.groupId, leftAt: null },
        select: { userId: true },
      });
      const peerIds = peers
        .map((p) => p.userId)
        .filter((id) => id !== principal.id);
      await emitNotificationMany(peerIds, {
        kind: "GROUP_INVITED",
        groupId: result.groupId,
        groupName: group.name,
        subject: "joined",
        actorId: principal.id,
        actorName: user?.displayName ?? "朋友",
      });
      // The joiner themselves get a "you joined" entry — fits the
      // notifications inbox.
      await emitNotification(principal.id, {
        kind: "GROUP_INVITED",
        groupId: result.groupId,
        groupName: group.name,
        subject: "you-joined",
        actorId: principal.id,
        actorName: user?.displayName ?? "朋友",
      });
    }
  }
  return result;
}

// Re-export for callers (e.g. test fixtures) that prefer to construct
// invites directly without going through assertActiveGroupMember.
export { issueGroupInvite } from "@/services/auth/invites";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  doneCount: number;
}

/**
 * "加油榜" — completions inside this group, this calendar week (Mon→Mon
 * UTC for v1; Phase 6's tz refinement covers per-user TZ). Positive
 * sort, ranks members by encouragement not shame.
 */
export async function getGroupLeaderboard(
  principal: Principal,
  groupId: string,
  now: Date = new Date(),
): Promise<LeaderboardEntry[]> {
  await assertActiveGroupMember(principal.id, groupId);
  // Start of ISO week (Mon 00:00 UTC) for the given moment.
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const weekStart = d;

  const members = await prisma.groupMember.findMany({
    where: { groupId, leftAt: null },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  const counts = await prisma.completion.groupBy({
    by: ["userId"],
    where: {
      completedAt: { gte: weekStart },
      reminder: { groupId, isDeleted: false },
    },
    _count: { _all: true },
  });
  const byUser = new Map(counts.map((c) => [c.userId, c._count._all]));

  return members
    .map<LeaderboardEntry>((m) => ({
      userId: m.userId,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      doneCount: byUser.get(m.userId) ?? 0,
    }))
    .sort((a, b) => b.doneCount - a.doneCount || a.displayName.localeCompare(b.displayName));
}

/**
 * Per-week completion history. Returns N most recent ISO-week buckets
 * with member-level breakdown, used by HfGroupDetail's 历史 tab.
 */
export interface GroupHistoryWeek {
  weekStart: string; // YYYY-MM-DD (Monday)
  totalDone: number;
  members: Array<{
    userId: string;
    displayName: string;
    doneCount: number;
  }>;
}

export async function getGroupHistory(
  principal: Principal,
  groupId: string,
  opts: { weeks?: number; now?: Date } = {},
): Promise<GroupHistoryWeek[]> {
  await assertActiveGroupMember(principal.id, groupId);
  const weeks = Math.max(1, Math.min(opts.weeks ?? 8, 26));
  const now = opts.now ?? new Date();

  // Find this Monday 00:00 UTC, then walk back N-1 weeks.
  const start = new Date(now);
  const dow = (start.getUTCDay() + 6) % 7; // Mon=0
  start.setUTCDate(start.getUTCDate() - dow);
  start.setUTCHours(0, 0, 0, 0);
  const oldest = new Date(start);
  oldest.setUTCDate(oldest.getUTCDate() - 7 * (weeks - 1));

  const completions = await prisma.completion.findMany({
    where: {
      reminder: { groupId },
      completedAt: { gte: oldest },
    },
    select: {
      userId: true,
      completedAt: true,
      user: { select: { displayName: true } },
    },
  });

  // Bucket per week.
  const byWeek = new Map<string, Map<string, { name: string; n: number }>>();
  for (const c of completions) {
    const wk = new Date(c.completedAt);
    const wdow = (wk.getUTCDay() + 6) % 7;
    wk.setUTCDate(wk.getUTCDate() - wdow);
    wk.setUTCHours(0, 0, 0, 0);
    const key = wk.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, new Map());
    const inner = byWeek.get(key)!;
    const cur = inner.get(c.userId) ?? { name: c.user.displayName, n: 0 };
    cur.n += 1;
    inner.set(c.userId, cur);
  }

  // Always render N consecutive weeks even when empty.
  const out: GroupHistoryWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    const cursor = new Date(oldest);
    cursor.setUTCDate(cursor.getUTCDate() + 7 * i);
    const key = cursor.toISOString().slice(0, 10);
    const bucket = byWeek.get(key);
    const members = bucket
      ? Array.from(bucket.entries()).map(([userId, v]) => ({
          userId,
          displayName: v.name,
          doneCount: v.n,
        }))
      : [];
    out.push({
      weekStart: key,
      totalDone: members.reduce((acc, m) => acc + m.doneCount, 0),
      members: members.sort((a, b) => b.doneCount - a.doneCount),
    });
  }
  return out.reverse(); // newest first
}

/**
 * "Friction signal" — who in the group is behind on this week's
 * reminders. Powers the HfGroups ribbon ("阿莫 老忘") and the
 * leaderboard's 想搭把手 button. Returns members where
 * `doneCount === 0` AND `assignedCount > 0`.
 */
export interface FrictionEntry {
  userId: string;
  displayName: string;
  reminderId: string | null; // representative reminder to cheer about
  reminderTitle: string | null;
  weeklyDone: number;
  weeklyAssigned: number;
}

export async function getGroupFriction(
  principal: Principal,
  groupId: string,
  now: Date = new Date(),
): Promise<FrictionEntry[]> {
  await assertActiveGroupMember(principal.id, groupId);
  const start = new Date(now);
  const dow = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - dow);
  start.setUTCHours(0, 0, 0, 0);

  const members = await prisma.groupMember.findMany({
    where: { groupId, leftAt: null },
    include: { user: { select: { id: true, displayName: true } } },
  });
  if (members.length === 0) return [];

  // Pull this week's group reminders (assigned + completions per user).
  const reminders = await prisma.reminder.findMany({
    where: {
      groupId,
      isDeleted: false,
      OR: [{ dueAt: { gte: start } }, { dueAt: null }],
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      claims: { select: { userId: true } },
    },
  });
  const completions = await prisma.completion.findMany({
    where: {
      reminder: { groupId },
      completedAt: { gte: start },
    },
    select: { userId: true },
  });

  const doneByUser = new Map<string, number>();
  for (const c of completions) {
    doneByUser.set(c.userId, (doneByUser.get(c.userId) ?? 0) + 1);
  }
  // Assigned: assignee match OR claim match (fallback when no explicit
  // assignee).
  const assignedByUser = new Map<string, string[]>();
  for (const r of reminders) {
    const targets = new Set<string>();
    if (r.assigneeId) targets.add(r.assigneeId);
    for (const c of r.claims) targets.add(c.userId);
    for (const u of targets) {
      const arr = assignedByUser.get(u) ?? [];
      arr.push(r.id);
      assignedByUser.set(u, arr);
    }
  }

  const out: FrictionEntry[] = [];
  for (const m of members) {
    const done = doneByUser.get(m.userId) ?? 0;
    const assigned = (assignedByUser.get(m.userId) ?? []).length;
    if (done === 0 && assigned > 0) {
      const repId = (assignedByUser.get(m.userId) ?? [])[0] ?? null;
      const rep = reminders.find((r) => r.id === repId) ?? null;
      out.push({
        userId: m.userId,
        displayName: m.user.displayName,
        reminderId: repId,
        reminderTitle: rep?.title ?? null,
        weeklyDone: done,
        weeklyAssigned: assigned,
      });
    }
  }
  return out;
}

/**
 * Search active members in a group (for HfL2AtPicker @ picker).
 */
export async function searchGroupMembers(
  principal: Principal,
  groupId: string,
  query: string,
  limit = 20,
): Promise<Array<{ userId: string; displayName: string }>> {
  await assertActiveGroupMember(principal.id, groupId);
  const q = query.trim();
  const where: Prisma.GroupMemberWhereInput = {
    groupId,
    leftAt: null,
    ...(q
      ? {
          user: {
            displayName: { contains: q, mode: "insensitive" },
          },
        }
      : {}),
  };
  const members = await prisma.groupMember.findMany({
    where,
    include: { user: { select: { id: true, displayName: true } } },
    take: Math.min(limit, 50),
  });
  return members.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
  }));
}

// Sentinel used in tests + storybook scenarios:
export const GROUPS_SERVICE_VERSION = 1 as const;

// Help TypeScript infer types of update inputs even when callers omit
// fields that aren't part of the partial schema (e.g. ownerId is never
// part of the public update surface).
export type GroupUpdateData = Prisma.GroupUpdateInput;
