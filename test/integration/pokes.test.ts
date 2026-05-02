// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  getPokeQuota,
  listInbox,
  markPokeRead,
  sendPoke,
} from "@/services/pokes";
import { createGroup } from "@/services/groups";
import { createReminder } from "@/services/reminders";
import { createUser } from "@/services/auth/users";
import { ConfigKey, setConfig } from "@/services/config";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
} from "@/lib/api/errors";
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

async function setupGroupReminder() {
  const owner = await mk("owner");
  const member = await mk("member");
  const group = await createGroup(p(owner), { name: "g" });
  await prisma.groupMember.create({
    data: { groupId: group.id, userId: member.id, role: "MEMBER" },
  });
  const reminder = await createReminder(p(owner), {
    title: "晨跑",
    visibility: "GROUP",
    groupId: group.id,
  });
  return { owner, member, group, reminder };
}

describe("poke service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("sendPoke linked to a reminder writes Poke + Notification + advances quota", async () => {
    const { owner, member, reminder } = await setupGroupReminder();

    const r = await sendPoke(p(owner), {
      toUserId: member.id,
      reminderId: reminder.id,
      tone: "ALMOST",
      message: "差一点点",
    });
    expect(r.poke.fromId).toBe(owner.id);
    expect(r.poke.toId).toBe(member.id);
    expect(r.poke.reminderId).toBe(reminder.id);
    expect(r.poke.tone).toBe("ALMOST");
    expect(r.quota.used).toBe(1);
    expect(r.quota.remaining).toBe(2);

    const notif = await prisma.notification.findFirstOrThrow({
      where: { userId: member.id, type: "POKE_RECEIVED" },
    });
    expect((notif.payload as Record<string, unknown>).pokeId).toBe(r.poke.id);
  });

  it("rejects self-poke with BadRequestError", async () => {
    const u = await mk("u");
    await expect(
      sendPoke(p(u), {
        toUserId: u.id,
        tone: "THINKING",
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects unlinked poke when global flag is OFF (default)", async () => {
    const a = await mk("a");
    const b = await mk("b");
    await prisma.pokeSetting.create({
      data: { userId: b.id, allowUnlinkedPoke: true },
    });
    await expect(
      sendPoke(p(a), { toUserId: b.id, tone: "THINKING" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects unlinked poke when recipient hasn't opted in (even if global flag is ON)", async () => {
    await setConfig(ConfigKey.PokeAllowUnlinked, true);
    const a = await mk("a");
    const b = await mk("b");
    await expect(
      sendPoke(p(a), { toUserId: b.id, tone: "THINKING" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows unlinked poke when both global flag AND recipient opt-in are true", async () => {
    await setConfig(ConfigKey.PokeAllowUnlinked, true);
    const a = await mk("a");
    const b = await mk("b");
    await prisma.pokeSetting.create({
      data: { userId: b.id, allowUnlinkedPoke: true },
    });
    const r = await sendPoke(p(a), {
      toUserId: b.id,
      tone: "THINKING",
      message: "想到你了",
    });
    expect(r.poke.reminderId).toBeNull();
  });

  it("respects recipient doNotDisturb", async () => {
    const { owner, member, reminder } = await setupGroupReminder();
    await prisma.pokeSetting.create({
      data: { userId: member.id, doNotDisturb: true },
    });
    await expect(
      sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "ALMOST",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects poke linked to a reminder the sender can't access", async () => {
    const a = await mk("a");
    const b = await mk("b");
    // a's private reminder; b can't access it
    const aPriv = await createReminder(p(a), {
      title: "secret",
      visibility: "PRIVATE",
    });
    await expect(
      sendPoke(p(b), {
        toUserId: a.id,
        reminderId: aPriv.id,
        tone: "ALMOST",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  describe("quota", () => {
    it("4th poke returns TooManyRequestsError; quota matches default 3", async () => {
      const { owner, member, reminder } = await setupGroupReminder();
      for (let i = 0; i < 3; i++) {
        await sendPoke(p(owner), {
          toUserId: member.id,
          reminderId: reminder.id,
          tone: "ALMOST",
        });
      }
      await expect(
        sendPoke(p(owner), {
          toUserId: member.id,
          reminderId: reminder.id,
          tone: "ALMOST",
        }),
      ).rejects.toBeInstanceOf(TooManyRequestsError);

      const q = await getPokeQuota(p(owner), member.id);
      expect(q.used).toBe(3);
      expect(q.remaining).toBe(0);
      expect(q.limit).toBe(3);
    });

    it("limit is configurable via Config", async () => {
      await setConfig(ConfigKey.PokeDailyLimitPerRecipient, 5);
      const { owner, member, reminder } = await setupGroupReminder();
      const q0 = await getPokeQuota(p(owner), member.id);
      expect(q0.limit).toBe(5);
      for (let i = 0; i < 5; i++) {
        await sendPoke(p(owner), {
          toUserId: member.id,
          reminderId: reminder.id,
          tone: "ALMOST",
        });
      }
      await expect(
        sendPoke(p(owner), {
          toUserId: member.id,
          reminderId: reminder.id,
          tone: "ALMOST",
        }),
      ).rejects.toBeInstanceOf(TooManyRequestsError);
    });

    it("quota is per-recipient: A→B doesn't affect A→C", async () => {
      const a = await mk("a");
      const b = await mk("b");
      const c = await mk("c");
      const group = await createGroup(p(a), { name: "g" });
      await prisma.groupMember.createMany({
        data: [
          { groupId: group.id, userId: b.id, role: "MEMBER" },
          { groupId: group.id, userId: c.id, role: "MEMBER" },
        ],
      });
      const reminder = await createReminder(p(a), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      for (let i = 0; i < 3; i++) {
        await sendPoke(p(a), {
          toUserId: b.id,
          reminderId: reminder.id,
          tone: "ALMOST",
        });
      }
      // a→b is full; a→c should still work
      const r = await sendPoke(p(a), {
        toUserId: c.id,
        reminderId: reminder.id,
        tone: "THINKING",
      });
      expect(r.quota.used).toBe(1);
    });
  });

  describe("inbox + read", () => {
    it("listInbox returns pokes for the principal in reverse-chronological order", async () => {
      const { owner, member, reminder } = await setupGroupReminder();
      const p1 = await sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "ALMOST",
      });
      const p2 = await sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "THINKING",
      });
      const inbox = await listInbox(p(member), { limit: 30 });
      expect(inbox.map((x) => x.id)).toEqual([p2.poke.id, p1.poke.id]);
      expect(inbox[0].from.displayName).toBe("owner");
    });

    it("unreadOnly filter excludes pokes that have been read", async () => {
      const { owner, member, reminder } = await setupGroupReminder();
      const a = await sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "ALMOST",
      });
      const b = await sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "THINKING",
      });
      await markPokeRead(p(member), a.poke.id);
      const unread = await listInbox(p(member), {
        limit: 30,
        unreadOnly: true,
      });
      expect(unread.map((x) => x.id)).toEqual([b.poke.id]);
    });

    it("markPokeRead — only the recipient can mark; otherwise 403", async () => {
      const { owner, member, reminder } = await setupGroupReminder();
      const sent = await sendPoke(p(owner), {
        toUserId: member.id,
        reminderId: reminder.id,
        tone: "ALMOST",
      });
      // Owner is sender, not recipient
      await expect(
        markPokeRead(p(owner), sent.poke.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
      const updated = await markPokeRead(p(member), sent.poke.id);
      expect(updated.readAt).not.toBeNull();
      // Idempotent — calling again returns same readAt
      const again = await markPokeRead(p(member), sent.poke.id);
      expect(again.readAt?.getTime()).toBe(updated.readAt?.getTime());
    });

    it("markPokeRead — unknown id returns NotFoundError", async () => {
      const u = await mk("u");
      await expect(
        markPokeRead(p(u), "00000000-0000-0000-0000-000000000000"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
