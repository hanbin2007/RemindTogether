/**
 * Unified activity feed for /app/me + /app/me/notifications.
 *
 * Reads the Notification table only — every event source emits a row
 * via {@link emitNotification} so this stays a thin projection. Mixed
 * with the legacy Poke inbox (older rows pre-Phase-10 don't have a
 * matching Notification entry, so we LEFT JOIN by `payload->reminderId`).
 */
import type { Notification } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";

export type ActivityKind =
  | "POKE_RECEIVED"
  | "REMINDER_CLAIMED_BY_OTHER"
  | "REMINDER_COMPLETED_BY_OTHER"
  | "COMMENT_NEW"
  | "REACTION_NEW"
  | "GROUP_INVITED"
  | "STREAK_MILESTONE";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  createdAt: Date;
  readAt: Date | null;
  // Eagerly-flattened display fields so callers don't poke at payload.
  who: string | null;
  group: string | null;
  title: string;
  sub: string | null;
  // Whichever destination makes sense when tapped.
  href: string | null;
}

interface Payload {
  kind?: ActivityKind;
  reminderId?: string;
  reminderTitle?: string;
  groupId?: string;
  groupName?: string | null;
  claimerName?: string;
  completerName?: string;
  commenterName?: string;
  reactorName?: string;
  actorName?: string;
  emoji?: string;
  excerpt?: string;
  subject?: "joined" | "you-joined";
  days?: number;
}

function project(n: Notification): ActivityItem {
  const p = (n.payload ?? {}) as Payload;
  const kind = (n.type as ActivityKind) ?? p.kind ?? "POKE_RECEIVED";
  const base: ActivityItem = {
    id: n.id,
    kind,
    createdAt: n.createdAt,
    readAt: n.readAt,
    who: null,
    group: p.groupName ?? null,
    title: "",
    sub: null,
    href: null,
  };
  switch (kind) {
    case "POKE_RECEIVED":
      // Pre-Phase-10 schema for poke notifs writes the actor's name into
      // payload.fromName. Fall back gracefully when missing.
      return {
        ...base,
        who: (p as Record<string, unknown>).fromName as string | undefined ?? "朋友",
        title: "拍了拍你",
        sub: ((p as Record<string, unknown>).message as string | undefined) ?? p.reminderTitle ?? null,
        href: p.reminderId ? `/app/poke/${n.id}` : "/app/me/notifications",
      };
    case "REMINDER_CLAIMED_BY_OTHER":
      return {
        ...base,
        who: p.claimerName ?? "朋友",
        title: "认领了",
        sub: p.reminderTitle ?? null,
        href: p.reminderId ? `/app/reminders/${p.reminderId}` : null,
      };
    case "REMINDER_COMPLETED_BY_OTHER":
      return {
        ...base,
        who: p.completerName ?? "朋友",
        title: "完成了",
        sub: p.reminderTitle ?? null,
        href: p.reminderId ? `/app/reminders/${p.reminderId}` : null,
      };
    case "COMMENT_NEW":
      return {
        ...base,
        who: p.commenterName ?? "朋友",
        title: "留言了",
        sub: p.excerpt ?? p.reminderTitle ?? null,
        href: p.reminderId ? `/app/reminders/${p.reminderId}` : null,
      };
    case "REACTION_NEW":
      return {
        ...base,
        who: p.reactorName ?? "朋友",
        title: `${p.emoji ?? "❤️"} 给了你`,
        sub: p.reminderTitle ?? null,
        href: p.reminderId ? `/app/reminders/${p.reminderId}` : null,
      };
    case "GROUP_INVITED":
      return {
        ...base,
        who: p.actorName ?? "朋友",
        title:
          p.subject === "you-joined" ? "你加入了" : "加入了你",
        sub: p.groupName ?? null,
        href: p.groupId ? `/app/groups/${p.groupId}` : null,
      };
    case "STREAK_MILESTONE":
      return {
        ...base,
        who: null,
        title: "本周加油榜",
        sub: `你已经连胜 ${p.days ?? 0} 天啦`,
        href: "/app/me/streak",
      };
    default:
      return { ...base, title: kind, sub: null };
  }
}

/**
 * Recent activity for the principal. `unreadOnly` filters server-side
 * (used by the bell badge counter).
 */
export async function listActivity(
  principal: Principal,
  opts: { limit?: number; unreadOnly?: boolean } = {},
): Promise<ActivityItem[]> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const rows = await prisma.notification.findMany({
    where: {
      userId: principal.id,
      ...(opts.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(project);
}

/** Unread count — cheap because of the (userId, readAt, createdAt) index. */
export async function countUnread(principal: Principal): Promise<number> {
  return prisma.notification.count({
    where: { userId: principal.id, readAt: null },
  });
}

/** Mark-read; returns number of rows touched (idempotent). */
export async function markActivityRead(
  principal: Principal,
  ids: string[],
): Promise<number> {
  const r = await prisma.notification.updateMany({
    where: {
      userId: principal.id,
      id: { in: ids },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return r.count;
}

export async function markAllActivityRead(
  principal: Principal,
): Promise<number> {
  const r = await prisma.notification.updateMany({
    where: { userId: principal.id, readAt: null },
    data: { readAt: new Date() },
  });
  return r.count;
}
