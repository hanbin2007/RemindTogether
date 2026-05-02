import {
  Prisma,
  type Notification,
  type Poke,
  type PokeTone,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import { broadcast, RtEvent, userRoom } from "@/lib/socket/broadcast";
import { ConfigKey, getConfigBool, getConfigInt } from "@/services/config";
import { sendPush } from "@/services/push";
import { assertReminderAccess } from "@/services/reminders";

// -----------------------------------------------------------------------------
// schemas
// -----------------------------------------------------------------------------

export const pokeToneValues = ["ALMOST", "THINKING", "NO_RUSH"] as const;

export const sendPokeInputSchema = z.object({
  toUserId: z.string().uuid(),
  reminderId: z.string().uuid().optional(),
  // 当用户从 HfL2Poked "拍回去 一起做" 触发时，传入原 poke id，
  // 服务端会验证：原 poke 的发送者必须是当前 toUserId（你回拍的对象）
  // 且接收者必须是当前 fromId（你自己）— 反之拒绝。
  replyToId: z.string().uuid().optional(),
  tone: z.enum(pokeToneValues),
  message: z
    .string()
    .trim()
    .max(140, "想说的话最多 140 字")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});
export type SendPokeInput = z.infer<typeof sendPokeInputSchema>;

export const listInboxQuerySchema = z.object({
  /** Page size, default 30, hard cap 100. */
  limit: z.coerce.number().int().min(1).max(100).default(30),
  /** Cursor: only items sent BEFORE this ISO timestamp. */
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  /** When true, only unread pokes (readAt is null). */
  unreadOnly: z.coerce.boolean().optional(),
});
export type ListInboxQuery = z.infer<typeof listInboxQuerySchema>;

// -----------------------------------------------------------------------------
// today boundary (UTC for now; Phase 6 will refine to recipient TZ alongside
// the streak engine).
// -----------------------------------------------------------------------------

function pokeBody(tone: string, message: string | null): string {
  if (message) return message;
  switch (tone) {
    case "ALMOST":
      return "差一点点～";
    case "THINKING":
      return "想到你了";
    case "NO_RUSH":
      return "不急，慢慢来";
    default:
      return "拍拍";
  }
}

function startOfTodayUtc(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUtc(now = new Date()): Date {
  const d = startOfTodayUtc(now);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

// -----------------------------------------------------------------------------
// quota
// -----------------------------------------------------------------------------

export interface QuotaSnapshot {
  toUserId: string;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
}

/** Read-only quota check; doesn't lock anything. */
export async function getPokeQuota(
  principal: Principal,
  toUserId: string,
): Promise<QuotaSnapshot> {
  const limit = await getConfigInt(ConfigKey.PokeDailyLimitPerRecipient);
  const used = await prisma.poke.count({
    where: {
      fromId: principal.id,
      toId: toUserId,
      sentAt: { gte: startOfTodayUtc() },
    },
  });
  return {
    toUserId,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: endOfTodayUtc(),
  };
}

// -----------------------------------------------------------------------------
// send
// -----------------------------------------------------------------------------

interface SendResult {
  poke: Poke;
  notification: Notification;
  quota: QuotaSnapshot;
}

export async function sendPoke(
  principal: Principal,
  rawInput: SendPokeInput,
): Promise<SendResult> {
  const input = sendPokeInputSchema.parse(rawInput);
  if (input.toUserId === principal.id) {
    throw new BadRequestError("self_poke", "拍拍不要发给自己");
  }

  const recipient = await prisma.user.findUnique({
    where: { id: input.toUserId },
    select: {
      id: true,
      isBanned: true,
      displayName: true,
      avatarUrl: true,
    },
  });
  if (!recipient || recipient.isBanned) {
    throw new NotFoundError("recipient");
  }

  // Linked vs unlinked policy.
  if (input.reminderId) {
    // Sender must have access to the reminder they're poking about
    // (private = only creator; group = group member).
    await assertReminderAccess(principal, input.reminderId);
  } else {
    const globalAllow = await getConfigBool(ConfigKey.PokeAllowUnlinked);
    if (!globalAllow) {
      throw new BadRequestError(
        "unlinked_disabled",
        "现在只允许针对具体提醒发拍拍",
      );
    }
    const recipientSetting = await prisma.pokeSetting.findUnique({
      where: { userId: input.toUserId },
    });
    if (!recipientSetting?.allowUnlinkedPoke) {
      throw new ForbiddenError("recipient_no_unlinked");
    }
  }

  // Do-not-disturb (boolean toggle from PokeSetting).
  const recipientSetting = await prisma.pokeSetting.findUnique({
    where: { userId: input.toUserId },
  });
  if (recipientSetting?.doNotDisturb) {
    throw new ForbiddenError("recipient_dnd");
  }

  // Time-window DND from User.dndStart/End (HfProfile "勿扰" panel).
  // Stored as "HH:MM" strings. We compare against the recipient's local
  // wall clock so 23:00–07:00 wraps midnight correctly.
  const recipientUser = await prisma.user.findUnique({
    where: { id: input.toUserId },
    select: { dndStart: true, dndEnd: true, timezone: true },
  });
  if (recipientUser?.dndStart && recipientUser?.dndEnd) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: recipientUser.timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const nowHM = fmt.format(new Date()); // "HH:MM"
    const inWindow = (() => {
      const [s, e] = [recipientUser.dndStart, recipientUser.dndEnd];
      if (s <= e) return nowHM >= s && nowHM < e;
      // wrap midnight: e.g. 23:00 → 07:00 — true when in [s, 24:00) ∪ [00:00, e)
      return nowHM >= s || nowHM < e;
    })();
    if (inWindow) {
      throw new ForbiddenError("recipient_dnd_window");
    }
  }

  // Reply-to: validate the chain — caller must be the original recipient,
  // and the original sender must be input.toUserId. Cross-talk poking is
  // refused so "拍回去" can only be the literal opposite direction.
  if (input.replyToId) {
    const original = await prisma.poke.findUnique({
      where: { id: input.replyToId },
      select: { fromId: true, toId: true },
    });
    if (
      !original ||
      original.fromId !== input.toUserId ||
      original.toId !== principal.id
    ) {
      throw new BadRequestError(
        "reply_chain_mismatch",
        "拍回去对象不匹配 — 这条不是你收到的拍拍",
      );
    }
  }

  const limit = await getConfigInt(ConfigKey.PokeDailyLimitPerRecipient);

  // Pessimistic quota check: lock the recipient User row so concurrent
  // pokes from the same sender to the same recipient serialise on this
  // SELECT FOR UPDATE. Postgres releases the lock on commit. count()
  // inside the same tx then sees the latest committed inserts.
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${input.toUserId} FOR UPDATE`;

    const used = await tx.poke.count({
      where: {
        fromId: principal.id,
        toId: input.toUserId,
        sentAt: { gte: startOfTodayUtc() },
      },
    });
    if (used >= limit) {
      throw new TooManyRequestsError(
        "poke_quota_exceeded",
        `今天对 ta 已经发了 ${used} 次，明天再来吧`,
      );
    }
    const poke = await tx.poke.create({
      data: {
        fromId: principal.id,
        toId: input.toUserId,
        reminderId: input.reminderId ?? null,
        tone: input.tone as PokeTone,
        message: input.message ?? null,
        replyToId: input.replyToId ?? null,
      },
    });
    const notification = await tx.notification.create({
      data: {
        userId: input.toUserId,
        type: "POKE_RECEIVED",
        payload: {
          pokeId: poke.id,
          from: { id: principal.id, email: principal.email },
          tone: poke.tone,
          message: poke.message,
          reminderId: poke.reminderId,
        } as Prisma.InputJsonValue,
      },
    });
    return { poke, notification, used: used + 1 };
  });

  // Out-of-transaction broadcast — best-effort; canonical state is PG.
  // We attach a tiny sender card so the recipient page can render
  // without a follow-up query.
  const sender = await prisma.user.findUnique({
    where: { id: principal.id },
    select: { id: true, displayName: true, avatarUrl: true },
  });

  await broadcast(userRoom(input.toUserId), RtEvent.PokeReceived, {
    poke: result.poke,
    from: sender,
  });
  await broadcast(userRoom(input.toUserId), RtEvent.NotificationNew, {
    notification: result.notification,
  });

  // Web Push fan-out — best-effort, doesn't block the response. The
  // realtime broadcast covers in-app delivery; this is for the case
  // where the recipient closed the tab.
  sendPush(input.toUserId, {
    title: `${sender?.displayName ?? "有人"} 想到你了`,
    body: pokeBody(result.poke.tone, result.poke.message),
    url: "/app",
    tag: `poke:${result.poke.id}`,
    data: {
      type: "poke",
      pokeId: result.poke.id,
      reminderId: result.poke.reminderId,
    },
  }).catch(() => {
    /* swallow — in-app realtime + Notification row remain authoritative */
  });

  return {
    poke: result.poke,
    notification: result.notification,
    quota: {
      toUserId: input.toUserId,
      used: result.used,
      limit,
      remaining: Math.max(0, limit - result.used),
      resetsAt: endOfTodayUtc(),
    },
  };
}

// -----------------------------------------------------------------------------
// inbox / read
// -----------------------------------------------------------------------------

export interface InboxItem extends Poke {
  from: { id: string; displayName: string; avatarUrl: string | null };
}

export async function listInbox(
  principal: Principal,
  query: ListInboxQuery,
): Promise<InboxItem[]> {
  return prisma.poke.findMany({
    where: {
      toId: principal.id,
      ...(query.before ? { sentAt: { lt: query.before } } : {}),
      ...(query.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { sentAt: "desc" },
    take: query.limit,
    include: {
      from: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  }) as unknown as Promise<InboxItem[]>;
}

export async function markPokeRead(
  principal: Principal,
  pokeId: string,
): Promise<Poke> {
  const row = await prisma.poke.findUnique({ where: { id: pokeId } });
  if (!row) throw new NotFoundError("poke");
  if (row.toId !== principal.id) throw new ForbiddenError("not_recipient");
  if (row.readAt) return row;
  return prisma.poke.update({
    where: { id: pokeId },
    data: { readAt: new Date() },
  });
}

// -----------------------------------------------------------------------------
// poke-context (last poke between two users) — for HfPoke "上次拍是 N 天前"
// -----------------------------------------------------------------------------

export interface PokeContext {
  toUserId: string;
  remaining: number;
  lastSentAt: Date | null;
  lastReceivedAt: Date | null;
  windowDnd: boolean;
}

export async function getPokeContext(
  principal: Principal,
  toUserId: string,
): Promise<PokeContext> {
  const [quota, lastSent, lastReceived, recipientUser] = await Promise.all([
    getPokeQuota(principal, toUserId),
    prisma.poke.findFirst({
      where: { fromId: principal.id, toId: toUserId },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
    prisma.poke.findFirst({
      where: { fromId: toUserId, toId: principal.id },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
    prisma.user.findUnique({
      where: { id: toUserId },
      select: { dndStart: true, dndEnd: true, timezone: true },
    }),
  ]);

  // Compute whether ta is currently inside their DND window — purely a
  // client hint; the actual check happens in sendPoke.
  let windowDnd = false;
  if (recipientUser?.dndStart && recipientUser?.dndEnd) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: recipientUser.timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const hm = fmt.format(new Date());
    windowDnd =
      recipientUser.dndStart <= recipientUser.dndEnd
        ? hm >= recipientUser.dndStart && hm < recipientUser.dndEnd
        : hm >= recipientUser.dndStart || hm < recipientUser.dndEnd;
  }

  return {
    toUserId,
    remaining: quota.remaining,
    lastSentAt: lastSent?.sentAt ?? null,
    lastReceivedAt: lastReceived?.sentAt ?? null,
    windowDnd,
  };
}
