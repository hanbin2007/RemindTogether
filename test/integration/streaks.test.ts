// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  closeOutMissedDays,
  getStreakStatus,
  recordCompletionMilestone,
  skipToday,
} from "@/services/streaks";
import { createReminder, completeReminder } from "@/services/reminders";
import { createUser } from "@/services/auth/users";
import { ConfigKey, setConfig } from "@/services/config";
import { BadRequestError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import { resetDb, prisma } from "./setup-db";

function p(u: { id: string; email: string }): Principal {
  return { id: u.id, email: u.email, isAdmin: false, emailIsVerified: true };
}

async function mk(name: string) {
  return createUser({
    email: `${name}@example.com`,
    password: "Pa55word!",
    displayName: name,
  });
}

/** Helper: create a private reminder, then mark it completed at `at`. */
async function completeAt(userId: string, at: Date) {
  // Backdate the completion by writing it directly. The service layer
  // always uses `now()`; for streak tests we need control over the date.
  const reminder = await prisma.reminder.create({
    data: {
      title: "x",
      visibility: "PRIVATE",
      creatorId: userId,
      status: "ACTIVE",
    },
  });
  await prisma.completion.create({
    data: { reminderId: reminder.id, userId, completedAt: at },
  });
  return reminder;
}

const TZ_UTC = "UTC";

async function setUserTz(userId: string, tz: string) {
  await prisma.user.update({ where: { id: userId }, data: { timezone: tz } });
}

describe("streak service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("getStreakStatus on a brand-new account returns 0/PENDING with empty history", async () => {
    const u = await mk("u");
    const status = await getStreakStatus(p(u));
    expect(status.current).toBe(0);
    expect(status.longest).toBe(0);
    expect(status.shieldCards).toBe(0);
    expect(status.todayStatus).toBe("PENDING");
    expect(status.recent).toEqual([]);
  });

  it("today's completion makes current streak = 1 even before close-out", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    const now = new Date("2026-05-10T12:00:00Z");
    await completeAt(u.id, now);
    const status = await getStreakStatus(p(u), now);
    expect(status.todayStatus).toBe("DONE");
    expect(status.current).toBe(1);
  });

  it("close-out walks past days marking DONE / MISSED correctly; MISSED breaks streak", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    // Day 1 (May 1): completion. Day 2 (May 2): nothing. Day 3 (May 3): completion.
    await completeAt(u.id, new Date("2026-05-01T12:00:00Z"));
    await completeAt(u.id, new Date("2026-05-03T12:00:00Z"));

    const now = new Date("2026-05-04T12:00:00Z");
    const r = await closeOutMissedDays(u.id, now);
    expect(r.closed).toBe(3);

    const days = await prisma.streakDay.findMany({
      where: { userId: u.id },
      orderBy: { date: "asc" },
    });
    expect(days.map((d) => d.status)).toEqual(["DONE", "MISSED", "DONE"]);

    const status = await getStreakStatus(p(u), now);
    // Today (May 4) PENDING; effective streak = 1 (just the May 3 DONE)
    expect(status.todayStatus).toBe("PENDING");
    expect(status.current).toBe(1);
    expect(status.longest).toBe(1);
  });

  it("missing day with shield card available → PROTECTED, card -1, streak survives", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    await prisma.shieldCard.create({ data: { userId: u.id, count: 1 } });

    await completeAt(u.id, new Date("2026-05-01T12:00:00Z"));
    // May 2: nothing
    await completeAt(u.id, new Date("2026-05-03T12:00:00Z"));

    const now = new Date("2026-05-04T00:30:00Z");
    await closeOutMissedDays(u.id, now);
    const days = await prisma.streakDay.findMany({
      where: { userId: u.id },
      orderBy: { date: "asc" },
    });
    expect(days.map((d) => d.status)).toEqual(["DONE", "PROTECTED", "DONE"]);
    const card = await prisma.shieldCard.findUnique({ where: { userId: u.id } });
    expect(card?.count).toBe(0);

    const status = await getStreakStatus(p(u), now);
    expect(status.current).toBe(3); // streak survived
  });

  it("hitting a 7-day streak awards a shield card; cap respected", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    // Complete on 7 consecutive days (May 1..7), check on May 8
    for (let d = 1; d <= 7; d++) {
      const dd = String(d).padStart(2, "0");
      await completeAt(u.id, new Date(`2026-05-${dd}T12:00:00Z`));
    }
    const now = new Date("2026-05-08T12:00:00Z");
    await closeOutMissedDays(u.id, now);

    const card = await prisma.shieldCard.findUnique({ where: { userId: u.id } });
    expect(card?.count).toBe(1);
    expect(card?.lastEarnedAt?.toISOString().slice(0, 10)).toBe("2026-05-07");
  });

  it("respects the configurable shield card cap", { timeout: 30_000 }, async () => {
    await setConfig(ConfigKey.ShieldCardMaxHeld, 2);
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    // 14 consecutive days → would award 2 cards (at day 7 and 14)
    for (let d = 1; d <= 14; d++) {
      const dd = String(d).padStart(2, "0");
      await completeAt(u.id, new Date(`2026-05-${dd}T12:00:00Z`));
    }
    const now = new Date("2026-05-15T12:00:00Z");
    await closeOutMissedDays(u.id, now);
    const card = await prisma.shieldCard.findUnique({ where: { userId: u.id } });
    expect(card?.count).toBe(2);

    // 21 days → would be 3 if uncapped; should still be 2
    for (let d = 15; d <= 21; d++) {
      const dd = String(d).padStart(2, "0");
      await completeAt(u.id, new Date(`2026-05-${dd}T12:00:00Z`));
    }
    const next = new Date("2026-05-22T12:00:00Z");
    await closeOutMissedDays(u.id, next);
    const card2 = await prisma.shieldCard.findUnique({
      where: { userId: u.id },
    });
    expect(card2?.count).toBe(2); // capped
  });

  it("close-out is idempotent — re-running doesn't duplicate StreakDay rows", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    await completeAt(u.id, new Date("2026-05-01T12:00:00Z"));
    const now = new Date("2026-05-03T12:00:00Z");
    const first = await closeOutMissedDays(u.id, now);
    const second = await closeOutMissedDays(u.id, now);
    expect(first.closed).toBe(2);
    expect(second.closed).toBe(0);
    expect(
      await prisma.streakDay.count({ where: { userId: u.id } }),
    ).toBe(2);
  });

  it("skipToday inserts a SKIPPED row that doesn't break the streak", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    await completeAt(u.id, new Date("2026-05-01T12:00:00Z"));
    await completeAt(u.id, new Date("2026-05-02T12:00:00Z"));
    // Day 3 (May 3) — user explicitly skips
    const day3Now = new Date("2026-05-03T08:00:00Z");
    await skipToday(p(u), day3Now);

    // Tomorrow (May 4) — close out
    const day4Now = new Date("2026-05-04T12:00:00Z");
    await closeOutMissedDays(u.id, day4Now);
    const status = await getStreakStatus(p(u), day4Now);
    // 3 consecutive non-MISSED days
    expect(status.current).toBe(3);
    expect(
      await prisma.streakDay.findMany({
        where: { userId: u.id },
        orderBy: { date: "asc" },
      }),
    ).toHaveLength(3);
  });

  it("skipToday rejects when the user already completed something today", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    const now = new Date("2026-05-01T12:00:00Z");
    await completeAt(u.id, now);
    await expect(skipToday(p(u), now)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("recordCompletionMilestone broadcasts on the 7th day", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    // Pre-fill 6 DONE days (May 1..6)
    for (let d = 1; d <= 6; d++) {
      const dd = String(d).padStart(2, "0");
      await prisma.streakDay.create({
        data: {
          userId: u.id,
          date: new Date(`2026-05-${dd}T00:00:00Z`),
          status: "DONE",
        },
      });
    }
    // Now the user completes on day 7 (May 7) and we call the hook.
    // We can't directly assert the broadcast (no socket attached here)
    // but we can confirm the function returns without throwing — the
    // realtime e2e covers the wire-level visibility.
    const now = new Date("2026-05-07T12:00:00Z");
    await expect(
      recordCompletionMilestone(u.id, now),
    ).resolves.toBeUndefined();
  });

  it("end-to-end via completeReminder integrates with the streak engine", async () => {
    const u = await mk("u");
    await setUserTz(u.id, TZ_UTC);
    // Build 6 prior DONE days ending yesterday so today (real `now`) is
    // the 7th. We pin the prior days relative to today so the test isn't
    // sensitive to wall-clock drift across timezones.
    const todayIso = new Date().toISOString().slice(0, 10);
    for (let i = 6; i >= 1; i--) {
      const ago = new Date();
      ago.setUTCDate(ago.getUTCDate() - i);
      const iso = ago.toISOString().slice(0, 10);
      await prisma.streakDay.create({
        data: {
          userId: u.id,
          date: new Date(`${iso}T00:00:00Z`),
          status: "DONE",
        },
      });
    }
    const reminder = await createReminder(p(u), {
      title: "day 7",
      visibility: "PRIVATE",
    });
    await completeReminder(p(u), reminder.id);

    const status = await getStreakStatus(p(u));
    expect(status.todayIso).toBe(todayIso);
    expect(status.todayStatus).toBe("DONE");
    expect(status.current).toBe(7);
  });
});
