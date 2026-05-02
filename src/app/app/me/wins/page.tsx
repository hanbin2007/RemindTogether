/**
 * "我的小赢" — 8-week recap of completed days.
 *
 * Server fetches the user's StreakDay rows for the last 8 ISO weeks
 * (Mon–Sun) plus per-day Completion counts, groups them, and renders
 * `<HfL2WinsHistory />` inside a `<PageShell>`.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/hf";
import {
  HfL2WinsHistory,
  type HfL2WinsDay,
  type HfL2WinsDayStatus,
  type HfL2WinsMonthSummary,
  type HfL2WinsWeek,
} from "@/components/hf/screens/HfL2WinsHistory";

export const dynamic = "force-dynamic";

const WEEKS = 8;

/** YYYY-MM-DD in UTC. */
function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Monday at UTC midnight for the week containing `d`. */
function startOfIsoWeek(d: Date): Date {
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = out.getUTCDay(); // 0=Sun ... 6=Sat
  const offset = dow === 0 ? 6 : dow - 1; // back to Monday
  out.setUTCDate(out.getUTCDate() - offset);
  return out;
}

export default async function WinsHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const now = new Date();
  const thisMonday = startOfIsoWeek(now);
  const earliestMonday = new Date(thisMonday);
  earliestMonday.setUTCDate(earliestMonday.getUTCDate() - 7 * (WEEKS - 1));

  const [streakDays, completions] = await Promise.all([
    prisma.streakDay.findMany({
      where: { userId: principal.id, date: { gte: earliestMonday } },
      orderBy: { date: "asc" },
    }),
    prisma.completion.findMany({
      where: { userId: principal.id, completedAt: { gte: earliestMonday } },
      select: { completedAt: true },
    }),
  ]);

  // Status by ISO date.
  const statusByDate = new Map<string, HfL2WinsDayStatus>();
  for (const sd of streakDays) {
    statusByDate.set(isoDate(sd.date), sd.status as HfL2WinsDayStatus);
  }

  // doneCount by ISO date (ISO date computed in user's local TZ would
  // be more correct, but Phase 9 keeps this UTC to match the streak
  // service; revisit when TZ-aware aggregations land).
  const doneByDate = new Map<string, number>();
  for (const c of completions) {
    const d = isoDate(c.completedAt);
    doneByDate.set(d, (doneByDate.get(d) ?? 0) + 1);
  }

  // Build weeks newest-first.
  const weeks: HfL2WinsWeek[] = [];
  for (let i = 0; i < WEEKS; i++) {
    const wkStart = new Date(thisMonday);
    wkStart.setUTCDate(wkStart.getUTCDate() - 7 * i);
    const days: HfL2WinsDay[] = [];
    let weekDone = 0;
    for (let dd = 0; dd < 7; dd++) {
      const day = new Date(wkStart);
      day.setUTCDate(day.getUTCDate() + dd);
      const date = isoDate(day);
      const doneCount = doneByDate.get(date) ?? 0;
      const status: HfL2WinsDayStatus =
        statusByDate.get(date) ?? (doneCount > 0 ? "DONE" : "NONE");
      days.push({ date, doneCount, status });
      weekDone += doneCount;
    }
    weeks.push({ weekStart: isoDate(wkStart), doneCount: weekDone, days });
  }

  // Monthly roll-up across the same window.
  const byMonth = new Map<string, number>();
  for (const [date, count] of doneByDate.entries()) {
    const month = date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + count);
  }
  const monthSummaries: HfL2WinsMonthSummary[] = Array.from(byMonth.entries())
    .map(([month, doneCount]) => ({ month, doneCount }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  return (
    <PageShell isAdmin={principal.isAdmin} tabActive={4}>
      <HfL2WinsHistory weeks={weeks} monthSummaries={monthSummaries} />
    </PageShell>
  );
}
