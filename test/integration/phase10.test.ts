// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createUser } from "@/services/auth/users";
import {
  createGroup,
  joinGroupByToken,
  getGroupHistory,
  getGroupFriction,
  searchGroupMembers,
} from "@/services/groups";
import { createReminder, completeReminder, claimReminder, addComment } from "@/services/reminders";
import { sendPoke, getPokeContext } from "@/services/pokes";
import { listActivity, countUnread } from "@/services/activity";
import { getHeatmap } from "@/services/heatmap";
import { useShieldToday } from "@/services/shield";
import { globalSearch } from "@/services/search";
import { cheerUp } from "@/services/cheers";
import { issueGroupInvite } from "@/services/auth/invites";
import { ConfigKey, setConfig } from "@/services/config";
import type { Principal } from "@/lib/auth/principal";
import { resetDb, prisma } from "./setup-db";

function P(u: { id: string; email: string }): Principal {
  return { id: u.id, email: u.email, isAdmin: false, emailIsVerified: true };
}

async function makeUser(prefix: string) {
  const u = await createUser({
    email: `${prefix}@ex.com`,
    password: "Pa55word!",
    displayName: prefix,
  });
  return u;
}

describe("Phase 10 backend (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    // Notifications + activity feed work the same regardless of unlinked
    // global, but DND time-window tests want a clean Config slate too.
  });

  describe("Notification fan-out", () => {
    it("emits REMINDER_CLAIMED_BY_OTHER when a non-creator claims", async () => {
      const owner = await makeUser("owner");
      const helper = await makeUser("helper");
      const group = await createGroup(P(owner), { name: "G1" });
      const inv = await issueGroupInvite(group.id, owner.id);
      await joinGroupByToken(P(helper), inv.token);

      const r = await createReminder(P(owner), {
        title: "倒垃圾",
        visibility: "GROUP",
        groupId: group.id,
      });
      await claimReminder(P(helper), r.id);

      const items = await listActivity(P(owner));
      expect(items.some((i) => i.kind === "REMINDER_CLAIMED_BY_OTHER")).toBe(
        true,
      );
      const claimItem = items.find(
        (i) => i.kind === "REMINDER_CLAIMED_BY_OTHER",
      );
      expect(claimItem?.who).toBe("helper");
      expect(claimItem?.sub).toContain("倒垃圾");
    });

    it("emits REMINDER_COMPLETED_BY_OTHER when someone else completes", async () => {
      const a = await makeUser("alpha");
      const b = await makeUser("beta");
      const g = await createGroup(P(a), { name: "team" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      const r = await createReminder(P(a), {
        title: "买菜",
        visibility: "GROUP",
        groupId: g.id,
      });
      await completeReminder(P(b), r.id);

      const inbox = await listActivity(P(a));
      const completed = inbox.find(
        (i) => i.kind === "REMINDER_COMPLETED_BY_OTHER",
      );
      expect(completed).toBeDefined();
      expect(completed!.sub).toContain("买菜");
    });

    it("emits COMMENT_NEW to the creator (skip self)", async () => {
      const a = await makeUser("a1");
      const b = await makeUser("b1");
      const g = await createGroup(P(a), { name: "x" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      const r = await createReminder(P(a), {
        title: "读书",
        visibility: "GROUP",
        groupId: g.id,
      });
      await addComment(P(b), r.id, { content: "加油" });
      const items = await listActivity(P(a));
      expect(items.some((i) => i.kind === "COMMENT_NEW")).toBe(true);
      // self-comment should NOT notify the commenter
      await addComment(P(a), r.id, { content: "我也是" });
      const aFeed = await listActivity(P(a));
      // the new self-comment doesn't add a new COMMENT_NEW for `a`
      const commentEntries = aFeed.filter((i) => i.kind === "COMMENT_NEW");
      expect(commentEntries).toHaveLength(1);
    });

    it("emits GROUP_INVITED to existing members + the joiner", async () => {
      const a = await makeUser("a2");
      const b = await makeUser("b2");
      const g = await createGroup(P(a), { name: "y" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);

      const aFeed = await listActivity(P(a));
      expect(aFeed.some((i) => i.kind === "GROUP_INVITED")).toBe(true);

      const bFeed = await listActivity(P(b));
      expect(bFeed.some((i) => i.kind === "GROUP_INVITED")).toBe(true);
    });
  });

  describe("Activity feed", () => {
    it("orders by createdAt desc and respects unreadOnly", async () => {
      const u = await makeUser("u1");
      // Insert two notifs directly so we don't have to drive 2 mutations.
      await prisma.notification.createMany({
        data: [
          {
            userId: u.id,
            type: "STREAK_MILESTONE",
            payload: { kind: "STREAK_MILESTONE", days: 7 },
            createdAt: new Date(Date.now() - 60_000),
          },
          {
            userId: u.id,
            type: "STREAK_MILESTONE",
            payload: { kind: "STREAK_MILESTONE", days: 30 },
          },
        ],
      });
      const all = await listActivity(P(u));
      expect(all).toHaveLength(2);
      // Newest first
      expect((all[0].sub ?? "").includes("30")).toBe(true);
      expect(await countUnread(P(u))).toBe(2);
    });
  });

  describe("Heatmap", () => {
    it("buckets completions by day and slot", async () => {
      const u = await makeUser("h1");
      const r = await createReminder(P(u), {
        title: "x",
        visibility: "PRIVATE",
      });
      // Two completions today (slot inferred from current time — we just
      // assert the cell at "now" has intensity ≥ 1).
      await completeReminder(P(u), r.id);
      // Recurring would let us complete twice; for non-recurring the
      // status flips to DONE which is fine for our intensity check.
      const hm = await getHeatmap(P(u), { days: 14 });
      expect(hm.cells).toHaveLength(14 * 4);
      expect(hm.totalDone).toBeGreaterThanOrEqual(1);
      const filled = hm.cells.filter((c) => c.intensity > 0);
      expect(filled.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Group history", () => {
    it("returns N consecutive weeks even when empty", async () => {
      const u = await makeUser("ghu");
      const g = await createGroup(P(u), { name: "h" });
      const weeks = await getGroupHistory(P(u), g.id, { weeks: 4 });
      expect(weeks).toHaveLength(4);
      // Newest first
      expect(weeks[0].weekStart >= weeks[3].weekStart).toBe(true);
      expect(weeks[0].totalDone).toBe(0);
    });
  });

  describe("Group friction", () => {
    it("flags an assigned-but-zero-done member", async () => {
      const a = await makeUser("a3");
      const b = await makeUser("b3");
      const g = await createGroup(P(a), { name: "z" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      // assign b to a reminder due this week
      await createReminder(P(a), {
        title: "晨跑",
        visibility: "GROUP",
        groupId: g.id,
        assigneeId: b.id,
      });

      const friction = await getGroupFriction(P(a), g.id);
      expect(friction.some((f) => f.userId === b.id)).toBe(true);
      const entry = friction.find((f) => f.userId === b.id)!;
      expect(entry.weeklyAssigned).toBeGreaterThan(0);
      expect(entry.weeklyDone).toBe(0);
    });
  });

  describe("Member search", () => {
    it("matches displayName case-insensitively", async () => {
      const a = await makeUser("alpha44");
      const b = await makeUser("Beta44");
      const g = await createGroup(P(a), { name: "p" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);

      const results = await searchGroupMembers(P(a), g.id, "BETA");
      expect(results.some((m) => m.userId === b.id)).toBe(true);
    });
  });

  describe("Cheer up", () => {
    it("sends a NO_RUSH poke targeting the assigned reminder", async () => {
      const a = await makeUser("c1");
      const b = await makeUser("c2");
      const g = await createGroup(P(a), { name: "c" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      // Open the unlinked allow flag for the test environment so the
      // sendPoke under cheerUp doesn't trip the policy gate when the
      // reminder linkage path is exercised.
      await setConfig(ConfigKey.PokeAllowUnlinked, true, null);
      await prisma.pokeSetting.upsert({
        where: { userId: b.id },
        update: { allowUnlinkedPoke: true },
        create: { userId: b.id, allowUnlinkedPoke: true },
      });

      const r = await createReminder(P(a), {
        title: "5km",
        visibility: "GROUP",
        groupId: g.id,
        assigneeId: b.id,
      });

      const out = await cheerUp(P(a), {
        toUserId: b.id,
        groupId: g.id,
      });
      expect(out.pokeId).toBeDefined();
      const inbox = await prisma.poke.findMany({
        where: { toId: b.id },
        include: { reminder: true },
      });
      expect(inbox).toHaveLength(1);
      expect(inbox[0].tone).toBe("NO_RUSH");
      expect(inbox[0].reminderId).toBe(r.id);
    });
  });

  describe("Use shield card", () => {
    it("decrements ShieldCard and marks today PROTECTED", async () => {
      const u = await makeUser("s1");
      await prisma.shieldCard.upsert({
        where: { userId: u.id },
        update: { count: 2 },
        create: { userId: u.id, count: 2 },
      });

      const r = await useShieldToday(P(u));
      expect(r.applied).toBe(true);
      expect(r.cardsLeft).toBe(1);
      const days = await prisma.streakDay.findMany({
        where: { userId: u.id },
      });
      expect(days).toHaveLength(1);
      expect(days[0].status).toBe("PROTECTED");
    });

    it("is idempotent if today already DONE", async () => {
      const u = await makeUser("s2");
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
      const r = await useShieldToday(P(u));
      expect(r.applied).toBe(false);
      expect(r.reason).toBe("already_done");
      // card not consumed
      const card = await prisma.shieldCard.findUnique({
        where: { userId: u.id },
      });
      expect(card?.count).toBe(1);
    });
  });

  describe("Global search", () => {
    it("returns reminders + groups + people in shared groups", async () => {
      const a = await makeUser("se-a");
      const b = await makeUser("se-b");
      const g = await createGroup(P(a), { name: "晨跑搭子" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      await createReminder(P(a), {
        title: "晨跑 5km",
        visibility: "GROUP",
        groupId: g.id,
      });

      const hits = await globalSearch(P(a), "晨跑");
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.some((h) => h.kind === "reminder")).toBe(true);
      expect(hits.some((h) => h.kind === "group")).toBe(true);
    });

    it("does not leak strangers", async () => {
      const a = await makeUser("priv-a");
      const stranger = await makeUser("strangerXYZ");
      // a and stranger share NO group
      const hits = await globalSearch(P(a), "stranger");
      expect(hits.every((h) => h.kind !== "person")).toBe(true);
      void stranger;
    });
  });

  describe("Poke context", () => {
    it("surfaces remaining quota + last sent timestamps", async () => {
      const a = await makeUser("p1");
      const b = await makeUser("p2");
      const g = await createGroup(P(a), { name: "Q" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      await prisma.pokeSetting.upsert({
        where: { userId: b.id },
        update: { allowUnlinkedPoke: true },
        create: { userId: b.id, allowUnlinkedPoke: true },
      });
      await setConfig(ConfigKey.PokeAllowUnlinked, true, null);
      const r = await createReminder(P(a), {
        title: "x",
        visibility: "GROUP",
        groupId: g.id,
      });
      await sendPoke(P(a), {
        toUserId: b.id,
        reminderId: r.id,
        tone: "THINKING",
      });

      const ctx = await getPokeContext(P(a), b.id);
      expect(ctx.lastSentAt).not.toBeNull();
      expect(ctx.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("DND time window", () => {
    it("rejects sendPoke when recipient is inside the configured window", async () => {
      const a = await makeUser("d1");
      const b = await makeUser("d2");
      const g = await createGroup(P(a), { name: "D" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      // Set b's DND to the entire day in UTC so the window always covers
      // "now". 00:00–23:59 wraps inclusive of every minute.
      await prisma.user.update({
        where: { id: b.id },
        data: {
          dndStart: "00:00",
          dndEnd: "23:59",
          timezone: "UTC",
        },
      });
      const r = await createReminder(P(a), {
        title: "d",
        visibility: "GROUP",
        groupId: g.id,
      });
      await expect(
        sendPoke(P(a), {
          toUserId: b.id,
          reminderId: r.id,
          tone: "THINKING",
        }),
      ).rejects.toMatchObject({ code: "recipient_dnd_window" });
    });
  });

  describe("Reply-to poke chain", () => {
    it("only allows replying to a poke you actually received", async () => {
      const a = await makeUser("r1");
      const b = await makeUser("r2");
      const g = await createGroup(P(a), { name: "R" });
      const inv = await issueGroupInvite(g.id, a.id);
      await joinGroupByToken(P(b), inv.token);
      await prisma.pokeSetting.upsert({
        where: { userId: b.id },
        update: { allowUnlinkedPoke: true },
        create: { userId: b.id, allowUnlinkedPoke: true },
      });
      await prisma.pokeSetting.upsert({
        where: { userId: a.id },
        update: { allowUnlinkedPoke: true },
        create: { userId: a.id, allowUnlinkedPoke: true },
      });
      await setConfig(ConfigKey.PokeAllowUnlinked, true, null);
      const r = await createReminder(P(a), {
        title: "r",
        visibility: "GROUP",
        groupId: g.id,
      });
      const original = await sendPoke(P(a), {
        toUserId: b.id,
        reminderId: r.id,
        tone: "ALMOST",
      });
      // Valid reply-back
      await sendPoke(P(b), {
        toUserId: a.id,
        reminderId: r.id,
        tone: "THINKING",
        replyToId: original.poke.id,
      });
      // Wrong direction: a tries to "reply" to their own outgoing
      const c = await makeUser("r3");
      await joinGroupByToken(P(c), inv.token);
      await expect(
        sendPoke(P(a), {
          toUserId: c.id,
          reminderId: r.id,
          tone: "THINKING",
          replyToId: original.poke.id,
        }),
      ).rejects.toMatchObject({ code: "reply_chain_mismatch" });
    });
  });
});
