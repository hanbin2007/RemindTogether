/**
 * Voluntary shield-card consumption — HfL2ShieldConfirm "用掉 1 张".
 *
 * Marks today as PROTECTED in StreakDay (preserves the streak) and
 * decrements ShieldCard.count atomically. Idempotent: if today is
 * already DONE/PROTECTED it's a no-op.
 */
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";
import { BadRequestError } from "@/lib/api/errors";

export interface UseShieldResult {
  applied: boolean;
  reason?: "already_done" | "already_protected";
  cardsLeft: number;
}

export async function useShieldToday(
  principal: Principal,
): Promise<UseShieldResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: principal.id },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? "UTC";

    // Local YYYY-MM-DD in user's tz.
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayIso = fmt.format(new Date()).slice(0, 10);
    const today = new Date(`${todayIso}T00:00:00.000Z`);

    // Already DONE or PROTECTED today? No-op.
    const existing = await tx.streakDay.findUnique({
      where: { userId_date: { userId: principal.id, date: today } },
      select: { status: true },
    });
    if (existing && existing.status === "DONE") {
      const card = await tx.shieldCard.findUnique({
        where: { userId: principal.id },
      });
      return {
        applied: false,
        reason: "already_done" as const,
        cardsLeft: card?.count ?? 0,
      };
    }
    if (existing && existing.status === "PROTECTED") {
      const card = await tx.shieldCard.findUnique({
        where: { userId: principal.id },
      });
      return {
        applied: false,
        reason: "already_protected" as const,
        cardsLeft: card?.count ?? 0,
      };
    }

    // Need a card.
    const card = await tx.shieldCard.findUnique({
      where: { userId: principal.id },
    });
    if (!card || card.count <= 0) {
      throw new BadRequestError("no_shield_card", "没保护卡了 — 别担心，断了再来");
    }

    await tx.shieldCard.update({
      where: { userId: principal.id },
      data: { count: { decrement: 1 } },
    });
    if (existing) {
      await tx.streakDay.update({
        where: { userId_date: { userId: principal.id, date: today } },
        data: { status: "PROTECTED" },
      });
    } else {
      await tx.streakDay.create({
        data: { userId: principal.id, date: today, status: "PROTECTED" },
      });
    }

    return { applied: true, cardsLeft: card.count - 1 };
  });
}
