// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createUser } from "@/services/auth/users";
import { skipDayWithShield, previewSkipDay } from "@/services/skip-day";
import { setConfig, ConfigKey } from "@/services/config";
import type { Principal } from "@/lib/auth/principal";
import { resetDb, prisma } from "./setup-db";

function P(u: { id: string; email: string }): Principal {
  return { id: u.id, email: u.email, isAdmin: false, emailIsVerified: true };
}

async function makeUser() {
  return createUser({
    email: `skip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@x.com`,
    password: "Pa55word!",
    displayName: "u",
  });
}

describe("skip-day service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("uses a shield card and saves the mood note", async () => {
    const u = await makeUser();
    await prisma.shieldCard.upsert({
      where: { userId: u.id },
      update: { count: 2 },
      create: { userId: u.id, count: 2 },
    });

    const r = await skipDayWithShield(P(u), { mood: "今天真的累" });
    expect(r.applied).toBe(true);
    expect(r.cardsLeft).toBe(1);
    expect(r.mood).toBe("今天真的累");

    // Persisted via the AdminLog diary path (Phase 11 will move this).
    const note = await prisma.adminLog.findFirst({
      where: { adminId: u.id, action: "self.skip_day_mood" },
    });
    expect(note).not.toBeNull();

    // StreakDay row created as PROTECTED.
    const days = await prisma.streakDay.findMany({ where: { userId: u.id } });
    expect(days).toHaveLength(1);
    expect(days[0].status).toBe("PROTECTED");
  });

  it("noop when no card available and no mood saved", async () => {
    const u = await makeUser();
    await expect(skipDayWithShield(P(u), {})).rejects.toMatchObject({
      code: "no_shield_card",
    });
    const days = await prisma.streakDay.findMany({ where: { userId: u.id } });
    expect(days).toHaveLength(0);
  });

  it("idempotent: already-DONE today does not consume a card", async () => {
    const u = await makeUser();
    await prisma.shieldCard.upsert({
      where: { userId: u.id },
      update: { count: 1 },
      create: { userId: u.id, count: 1 },
    });
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.streakDay.create({
      data: { userId: u.id, date: today, status: "DONE" },
    });
    const r = await skipDayWithShield(P(u), { mood: "无所谓" });
    expect(r.applied).toBe(false);
    expect(r.reason).toBe("already_done");
    const card = await prisma.shieldCard.findUnique({
      where: { userId: u.id },
    });
    expect(card?.count).toBe(1);
  });

  it("previewSkipDay surfaces cardsLeft + cap from config", async () => {
    const u = await makeUser();
    await setConfig(ConfigKey.ShieldCardMaxHeld, 5, null);
    await prisma.shieldCard.upsert({
      where: { userId: u.id },
      update: { count: 3 },
      create: { userId: u.id, count: 3 },
    });
    const p = await previewSkipDay(P(u));
    expect(p.cardsLeft).toBe(3);
    expect(p.cap).toBe(5);
  });
});
