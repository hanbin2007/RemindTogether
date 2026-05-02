import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";
import { tickCloseOuts } from "@/services/streaks";
import { AdminAction, recordAdminAction } from "./audit";

let lastTickAt = 0;
const TICK_DEBOUNCE_MS = 30_000;

export async function runStreakTickNow(
  admin: Principal,
): Promise<{ scanned: number; closed: number }> {
  const now = Date.now();
  if (now - lastTickAt < TICK_DEBOUNCE_MS) {
    // Still idempotent at the DB layer (StreakDay unique), but no point
    // hammering — return zero so the UI shows a "wait a bit" hint.
    return { scanned: 0, closed: 0 };
  }
  lastTickAt = now;
  const r = await tickCloseOuts();
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.RunStreakTick,
    targetType: "system",
    targetId: null,
    payload: r,
  });
  return r;
}

export interface DashboardKPIs {
  users: number;
  bannedUsers: number;
  admins: number;
  groups: number;
  disbandedGroups: number;
  reminders: number;
  remindersToday: number;
  completionsToday: number;
  pokesToday: number;
  reportsPending: number;
  pushSubscriptions: number;
  mailLogToday: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  const [
    users,
    bannedUsers,
    admins,
    groups,
    disbandedGroups,
    reminders,
    remindersToday,
    completionsToday,
    pokesToday,
    reportsPending,
    pushSubscriptions,
    mailLogToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.group.count(),
    prisma.group.count({ where: { isDisbanded: true } }),
    prisma.reminder.count({ where: { isDeleted: false } }),
    prisma.reminder.count({
      where: { createdAt: { gte: startOfTodayUtc }, isDeleted: false },
    }),
    prisma.completion.count({
      where: { completedAt: { gte: startOfTodayUtc } },
    }),
    prisma.poke.count({ where: { sentAt: { gte: startOfTodayUtc } } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.pushSubscription.count(),
    prisma.mailLog.count({ where: { createdAt: { gte: startOfTodayUtc } } }),
  ]);
  return {
    users,
    bannedUsers,
    admins,
    groups,
    disbandedGroups,
    reminders,
    remindersToday,
    completionsToday,
    pokesToday,
    reportsPending,
    pushSubscriptions,
    mailLogToday,
  };
}
