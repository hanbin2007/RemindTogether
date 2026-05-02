/**
 * Notification emission — central helper used by every service that
 * produces "something happened to you" rows. Keeps the schema for the
 * `payload` JSONB consistent so /api/me/activity (and the inbox) can
 * render them without a giant switch in 10 different places.
 *
 * Each helper runs after its outer transaction commits (best-effort) so a
 * failed notification never rolls back the canonical mutation.
 */
import type { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { broadcast, userRoom, RtEvent } from "@/lib/socket/broadcast";

/**
 * Shape of `payload` per type. Keep these stable — clients render them.
 *
 * - POKE_RECEIVED: written by services/pokes.ts directly (kept that
 *   way to stay inside the same transaction as the Poke row + quota
 *   bump). NOT emitted from here.
 * - REMINDER_CLAIMED_BY_OTHER: someone claimed your reminder
 * - REMINDER_COMPLETED_BY_OTHER: someone in your group completed
 * - COMMENT_NEW: someone commented on your reminder
 * - REACTION_NEW: someone reacted to your reminder
 * - GROUP_INVITED: someone accepted your invite (you = owner) OR you
 *   were just added (you = joiner). The `subject` field disambiguates.
 * - STREAK_MILESTONE: streak crossed 7/30/100 days
 * - REMINDER_DUE: scheduled — set by a cron, not from here yet
 */
export type NotifPayload =
  | {
      kind: "REMINDER_CLAIMED_BY_OTHER";
      reminderId: string;
      reminderTitle: string;
      claimerId: string;
      claimerName: string;
      groupId: string | null;
      groupName: string | null;
    }
  | {
      kind: "REMINDER_COMPLETED_BY_OTHER";
      reminderId: string;
      reminderTitle: string;
      completerId: string;
      completerName: string;
      groupId: string | null;
      groupName: string | null;
    }
  | {
      kind: "COMMENT_NEW";
      reminderId: string;
      reminderTitle: string;
      commenterId: string;
      commenterName: string;
      excerpt: string;
    }
  | {
      kind: "REACTION_NEW";
      reminderId: string;
      reminderTitle: string;
      reactorId: string;
      reactorName: string;
      emoji: string;
    }
  | {
      kind: "GROUP_INVITED";
      groupId: string;
      groupName: string;
      subject: "joined" | "you-joined";
      actorId: string;
      actorName: string;
    }
  | {
      kind: "STREAK_MILESTONE";
      days: number;
    }
  | {
      kind: "REMINDER_DUE";
      reminderId: string;
      reminderTitle: string;
      groupId: string | null;
      groupName: string | null;
      dueAt: string; // ISO
    };

const KIND_TO_TYPE: Record<NotifPayload["kind"], NotificationType> = {
  REMINDER_CLAIMED_BY_OTHER: "REMINDER_CLAIMED_BY_OTHER",
  REMINDER_COMPLETED_BY_OTHER: "REMINDER_COMPLETED_BY_OTHER",
  COMMENT_NEW: "COMMENT_NEW",
  REACTION_NEW: "REACTION_NEW",
  GROUP_INVITED: "GROUP_INVITED",
  STREAK_MILESTONE: "STREAK_MILESTONE",
  REMINDER_DUE: "REMINDER_DUE",
};

/**
 * Insert a Notification row + fire-and-forget realtime broadcast. Skips
 * silently when `userId === actorIdToSkip` (e.g. don't notify yourself
 * when you comment on your own reminder).
 */
export async function emitNotification(
  userId: string,
  payload: NotifPayload,
  opts?: { tx?: Prisma.TransactionClient; skipSelf?: string },
): Promise<void> {
  if (opts?.skipSelf && opts.skipSelf === userId) return;
  const client = opts?.tx ?? prisma;
  const row = await client.notification.create({
    data: {
      userId,
      type: KIND_TO_TYPE[payload.kind],
      payload: payload as Prisma.JsonObject,
    },
  });
  // Fire-and-forget — receiver's open client refreshes the inbox.
  broadcast(userRoom(userId), RtEvent.NotificationNew, {
    notification: row,
  }).catch(() => {
    /* swallow — DB row is canonical */
  });
}

/**
 * Bulk variant — for fanning a single event to N members of a group.
 */
export async function emitNotificationMany(
  userIds: string[],
  payload: NotifPayload,
  opts?: { tx?: Prisma.TransactionClient; skipSelf?: string },
): Promise<void> {
  await Promise.all(
    userIds.map((u) => emitNotification(u, payload, opts)),
  );
}
