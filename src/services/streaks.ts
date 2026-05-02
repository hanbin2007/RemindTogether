import { Prisma, type StreakDay, type StreakDayStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import {
  addDaysISO,
  dateOnlyUtc,
  isoFromDateColumn,
  localDateInTz,
  startOfDayInTz,
} from "@/lib/tz";
import { broadcast, RtEvent, userRoom } from "@/lib/socket/broadcast";
import { ConfigKey, getConfigInt } from "@/services/config";
import { sendPush } from "@/services/push";
import { emitNotification } from "@/services/notifications";

/** How far back the close-out walk is willing to go in one call. */
const MAX_CLOSEOUT_LOOKBACK_DAYS = 60;

/** Streak-length thresholds that trigger a 7/30-day milestone broadcast. */
const MILESTONE_THRESHOLDS = [7, 30] as const;

interface StreakSummary {
  current: number;
  longest: number;
  shieldCards: number;
  shieldCardCap: number;
  todayStatus: "DONE" | "PENDING" | "SKIPPED";
  /** "YYYY-MM-DD" anchored in the user's tz. */
  todayIso: string;
  /** Closed days in reverse chronological order (most recent 30 entries). */
  recent: Array<{ date: string; status: StreakDayStatus }>;
}

// -----------------------------------------------------------------------------
// internal: close-out logic
// -----------------------------------------------------------------------------

async function loadUser(userId: string): Promise<{
  id: string;
  timezone: string;
  createdAt: Date;
}> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, timezone: true, createdAt: true },
  });
  if (!u) throw new NotFoundError("user");
  return u;
}

/**
 * Walk forward from the user's latest StreakDay to (today - 1) in their
 * timezone, inserting one row per day with status DONE / PROTECTED /
 * MISSED. Idempotent: re-running is a no-op once everything is closed.
 */
export async function closeOutMissedDays(
  userId: string,
  now: Date = new Date(),
): Promise<{ closed: number }> {
  const user = await loadUser(userId);
  const todayIso = localDateInTz(now, user.timezone);
  const yesterdayIso = addDaysISO(todayIso, -1);

  // Latest closed day for the user
  const latest = await prisma.streakDay.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });

  let cursorIso: string;
  if (latest) {
    cursorIso = addDaysISO(isoFromDateColumn(latest.date), 1);
  } else {
    // First close-out for this user. UX rule: don't auto-create MISSED
    // rows for the period BEFORE their first ever completion — a brand
    // new account that hasn't done anything yet shouldn't accumulate
    // a streak history of failures. Start the walk from the day of the
    // earliest completion. If they have no completions at all, skip.
    const firstCompletion = await prisma.completion.findFirst({
      where: { userId },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true },
    });
    if (!firstCompletion) {
      return { closed: 0 };
    }
    const firstIso = localDateInTz(
      firstCompletion.completedAt,
      user.timezone,
    );
    const earliest = addDaysISO(yesterdayIso, -MAX_CLOSEOUT_LOOKBACK_DAYS);
    cursorIso = firstIso > earliest ? firstIso : earliest;
  }

  let closed = 0;
  while (cursorIso <= yesterdayIso) {
    if (closed >= MAX_CLOSEOUT_LOOKBACK_DAYS) break;
    const did = await closeOutDay(userId, cursorIso, user.timezone);
    if (did) closed++;
    cursorIso = addDaysISO(cursorIso, 1);
  }
  return { closed };
}

async function closeOutDay(
  userId: string,
  yyyymmdd: string,
  tz: string,
): Promise<boolean> {
  const dateCol = dateOnlyUtc(yyyymmdd);
  // Idempotent guard
  const existing = await prisma.streakDay.findUnique({
    where: { userId_date: { userId, date: dateCol } },
  });
  if (existing) return false;

  const start = startOfDayInTz(yyyymmdd, tz);
  const end = startOfDayInTz(addDaysISO(yyyymmdd, 1), tz);

  const completed = await prisma.completion.count({
    where: { userId, completedAt: { gte: start, lt: end } },
  });

  if (completed > 0) {
    await prisma.streakDay.create({
      data: { userId, date: dateCol, status: "DONE" },
    });
    await maybeAwardShieldCard(userId, yyyymmdd);
    return true;
  }

  // No completion. Look at shield card balance.
  const card = await prisma.shieldCard.findUnique({
    where: { userId },
  });
  if (card && card.count > 0) {
    await prisma.$transaction([
      prisma.streakDay.create({
        data: { userId, date: dateCol, status: "PROTECTED" },
      }),
      prisma.shieldCard.update({
        where: { userId },
        data: { count: { decrement: 1 } },
      }),
    ]);
    return true;
  }

  // No protection — break the streak.
  await prisma.streakDay.create({
    data: { userId, date: dateCol, status: "MISSED" },
  });
  return true;
}

/**
 * Compute the user's current streak length. A streak is the run of
 * consecutive non-MISSED days ending on `endingIso` (inclusive). Used
 * by the close-out walk to decide whether the day we just closed
 * should award a shield card.
 */
async function computeStreakAt(
  userId: string,
  endingIso: string,
): Promise<number> {
  // Only need the last MAX days; the streak can't be longer than that
  // in a single close-out window anyway.
  const days = await prisma.streakDay.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: MAX_CLOSEOUT_LOOKBACK_DAYS + 5,
  });
  let streak = 0;
  let cursor = endingIso;
  for (const d of days) {
    const dIso = isoFromDateColumn(d.date);
    if (dIso !== cursor) break; // gap
    if (d.status === "MISSED") break;
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

async function maybeAwardShieldCard(
  userId: string,
  closedDayIso: string,
): Promise<void> {
  const cap = await getConfigInt(ConfigKey.ShieldCardMaxHeld);
  const streak = await computeStreakAt(userId, closedDayIso);
  if (streak <= 0 || streak % 7 !== 0) return;

  const closedDay = dateOnlyUtc(closedDayIso);
  // Avoid double-awarding the same threshold if close-out is re-run.
  // We use ShieldCard.lastEarnedAt as a simple deduper: if we already
  // awarded on this exact day, skip.
  await prisma.$transaction(async (tx) => {
    const card = await tx.shieldCard.findUnique({ where: { userId } });
    if (!card) {
      await tx.shieldCard.create({
        data: { userId, count: 1, lastEarnedAt: closedDay },
      });
      return;
    }
    if (card.lastEarnedAt && card.lastEarnedAt.getTime() === closedDay.getTime()) {
      return; // already awarded for this very day
    }
    if (card.count >= cap) {
      // Cap reached; mark earned date so we don't keep re-checking,
      // but don't go above the ceiling.
      await tx.shieldCard.update({
        where: { userId },
        data: { lastEarnedAt: closedDay },
      });
      return;
    }
    await tx.shieldCard.update({
      where: { userId },
      data: { count: { increment: 1 }, lastEarnedAt: closedDay },
    });
  });
}

// -----------------------------------------------------------------------------
// public API
// -----------------------------------------------------------------------------

export async function getStreakStatus(
  principal: Principal,
  now: Date = new Date(),
): Promise<StreakSummary> {
  // Refresh history so the response is accurate even if cron is slow.
  await closeOutMissedDays(principal.id, now);

  const user = await loadUser(principal.id);
  const todayIso = localDateInTz(now, user.timezone);
  const yesterdayIso = addDaysISO(todayIso, -1);

  // Pull the last 30 closed days
  const days = await prisma.streakDay.findMany({
    where: { userId: principal.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Today status: explicit SKIP row, OR a completion exists, OR PENDING
  let todayStatus: StreakSummary["todayStatus"] = "PENDING";
  const explicitToday = await prisma.streakDay.findUnique({
    where: {
      userId_date: { userId: principal.id, date: dateOnlyUtc(todayIso) },
    },
  });
  if (explicitToday?.status === "SKIPPED") {
    todayStatus = "SKIPPED";
  } else {
    const todayStart = startOfDayInTz(todayIso, user.timezone);
    const tomorrowStart = startOfDayInTz(
      addDaysISO(todayIso, 1),
      user.timezone,
    );
    const todayCount = await prisma.completion.count({
      where: {
        userId: principal.id,
        completedAt: { gte: todayStart, lt: tomorrowStart },
      },
    });
    if (todayCount > 0) todayStatus = "DONE";
  }

  // Effective streak: consecutive non-MISSED days ending at
  // yesterday-or-today. We add today only if it's not PENDING.
  let streak = await computeStreakAt(principal.id, yesterdayIso);
  if (todayStatus !== "PENDING") streak += 1;

  // Longest: scan all StreakDay rows once. Cheap enough for v1.
  const all = await prisma.streakDay.findMany({
    where: { userId: principal.id },
    orderBy: { date: "asc" },
  });
  let longest = 0;
  let run = 0;
  let lastIso: string | null = null;
  for (const d of all) {
    const dIso = isoFromDateColumn(d.date);
    if (lastIso && addDaysISO(lastIso, 1) !== dIso) run = 0;
    if (d.status === "MISSED") {
      run = 0;
    } else {
      run++;
      if (run > longest) longest = run;
    }
    lastIso = dIso;
  }
  if (streak > longest) longest = streak;

  const card = await prisma.shieldCard.findUnique({
    where: { userId: principal.id },
  });
  const cap = await getConfigInt(ConfigKey.ShieldCardMaxHeld);

  return {
    current: streak,
    longest,
    shieldCards: card?.count ?? 0,
    shieldCardCap: cap,
    todayStatus,
    todayIso,
    recent: days.map((d) => ({
      date: isoFromDateColumn(d.date),
      status: d.status,
    })),
  };
}

/**
 * Manually mark today as SKIPPED. Doesn't break the streak and doesn't
 * consume a shield card. Idempotent — re-calling on the same day is a
 * no-op.
 */
export async function skipToday(
  principal: Principal,
  now: Date = new Date(),
): Promise<StreakDay> {
  const user = await loadUser(principal.id);
  const todayIso = localDateInTz(now, user.timezone);
  const dateCol = dateOnlyUtc(todayIso);

  // Reject if user already completed something today — no need to skip
  // a day they've already won.
  const todayStart = startOfDayInTz(todayIso, user.timezone);
  const tomorrowStart = startOfDayInTz(
    addDaysISO(todayIso, 1),
    user.timezone,
  );
  const todayCount = await prisma.completion.count({
    where: {
      userId: principal.id,
      completedAt: { gte: todayStart, lt: tomorrowStart },
    },
  });
  if (todayCount > 0) {
    throw new BadRequestError(
      "already_done_today",
      "今天已经有完成了，不需要跳过",
    );
  }

  // Make sure earlier days are properly closed first (so cron-late users
  // don't end up with a SKIPPED today and a missing yesterday).
  await closeOutMissedDays(principal.id, now);

  // Upsert today as SKIPPED (idempotent on re-call)
  return prisma.streakDay.upsert({
    where: { userId_date: { userId: principal.id, date: dateCol } },
    create: { userId: principal.id, date: dateCol, status: "SKIPPED" },
    update: { status: "SKIPPED" },
  });
}

/**
 * Hook called by completeReminder. If the user just crossed a 7/30-day
 * threshold (effective streak including today), broadcast
 * `streak:milestone` to the user's room so the UI can throw confetti.
 */
export async function recordCompletionMilestone(
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  // Only inspect if the user might be at a threshold — count completions
  // today ≥ 1 (true: we were just called from completeReminder).
  const user = await loadUser(userId).catch(() => null);
  if (!user) return;
  const todayIso = localDateInTz(now, user.timezone);
  const yesterdayIso = addDaysISO(todayIso, -1);

  const yesterdayStreak = await computeStreakAt(userId, yesterdayIso);
  const effective = yesterdayStreak + 1;

  if (!MILESTONE_THRESHOLDS.includes(effective as 7 | 30)) return;

  // De-dupe: if we've already broadcast for this same effective length
  // today (e.g. the user completes a second reminder), skip.
  const dedupeKey = `streak-milestone-${effective}-${todayIso}`;
  // Use the StreakDay table to dedupe via a probe row? Simpler: rely on
  // the fact that the user can only legitimately cross this threshold
  // once per day — and we use the existence of (userId, todayIso, DONE)
  // as a "today is already DONE in StreakDay" check (only true after
  // close-out runs, which is at midnight). Until then, we'd re-emit on
  // every completion. To avoid that, store a tiny memory map keyed by
  // dedupeKey.
  if (recentMilestones.has(dedupeKey)) return;
  recentMilestones.set(dedupeKey, Date.now());
  // Trim the cache occasionally to avoid unbounded growth.
  if (recentMilestones.size > 5000) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [k, v] of recentMilestones) {
      if (v < cutoff) recentMilestones.delete(k);
    }
  }

  await broadcast(userRoom(userId), RtEvent.StreakMilestone, {
    days: effective,
    type: effective === 7 ? "weekly" : "monthly",
  });

  // Persist to the inbox so it appears in /app/me/notifications + the
  // /api/me/activity feed.
  await emitNotification(userId, {
    kind: "STREAK_MILESTONE",
    days: effective,
  });

  // Web Push too (silent if user has no subscription).
  sendPush(userId, {
    title: effective === 7 ? "连胜 7 天 🎉" : "连胜 30 天 🏆",
    body:
      effective === 7
        ? "保护卡 +1，继续慢慢来。"
        : "你太厉害了，给自己点个赞。",
    url: "/app",
    tag: `streak:${effective}-${todayIso}`,
    data: { type: "streak_milestone", days: effective },
  }).catch(() => {
    /* swallow */
  });
}

const recentMilestones = new Map<string, number>();

// -----------------------------------------------------------------------------
// cron entrypoint
// -----------------------------------------------------------------------------

/**
 * Walk every user with at least one Completion and run their close-out.
 * Designed to run every ~30 min from server.ts. Cheap because each
 * close-out is mostly a SELECT max(date) + insert when needed.
 */
export async function tickCloseOuts(now: Date = new Date()): Promise<{
  scanned: number;
  closed: number;
}> {
  // Limit scope to users who have actually been active. A bare-bones v1
  // could just walk every User, but that's wasteful and we don't need
  // streak history for accounts that never completed anything.
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: { id: true },
  });
  let totalClosed = 0;
  for (const u of users) {
    try {
      const r = await closeOutMissedDays(u.id, now);
      totalClosed += r.closed;
    } catch (e) {
      // Best-effort: never let one user's quirk wedge the loop.
      // eslint-disable-next-line no-console
      console.warn("closeOut failed", { userId: u.id, err: e });
    }
  }
  return { scanned: users.length, closed: totalClosed };
}

// Helpful re-exports for tests
export type { StreakSummary };
export { Prisma };
