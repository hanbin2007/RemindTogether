// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  addComment,
  addReaction,
  assertReminderAccess,
  claimReminder,
  completeReminder,
  createReminder,
  deleteReminder,
  getReminder,
  listReminders,
  skipReminderDay,
  unclaimReminder,
  updateReminder,
} from "@/services/reminders";
import { createGroup } from "@/services/groups";
import { createTag } from "@/services/tags";
import { createUser } from "@/services/auth/users";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
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

async function setup() {
  const owner = await mk("owner");
  const member = await mk("member");
  const stranger = await mk("stranger");
  const group = await createGroup(p(owner), { name: "晨跑" });
  await prisma.groupMember.create({
    data: { groupId: group.id, userId: member.id, role: "MEMBER" },
  });
  return { owner, member, stranger, group };
}

describe("reminder service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe("createReminder", () => {
    it("creates a private reminder with tags", async () => {
      const u = await mk("u");
      const tag = await createTag(p(u), {
        name: "学习",
        iconName: "book",
        color: "#3366cc",
      });
      const r = await createReminder(p(u), {
        title: "看书 30 分钟",
        visibility: "PRIVATE",
        tagIds: [tag.id],
      });
      expect(r.title).toBe("看书 30 分钟");
      expect(r.visibility).toBe("PRIVATE");
      expect(r.creatorId).toBe(u.id);
      expect(r.groupId).toBeNull();
      expect(r.tags.map((t) => t.tag.name)).toEqual(["学习"]);
    });

    it("creates a group reminder when caller is a member", async () => {
      const { owner, member, group } = await setup();
      const r = await createReminder(p(member), {
        title: "晨跑 5km",
        visibility: "GROUP",
        groupId: group.id,
      });
      expect(r.visibility).toBe("GROUP");
      expect(r.groupId).toBe(group.id);
      expect(r.creatorId).toBe(member.id);
      // Owner (and other members) can read it
      const seen = await getReminder(p(owner), r.id);
      expect(seen.id).toBe(r.id);
    });

    it("rejects group reminder when caller is not a group member", async () => {
      const { stranger, group } = await setup();
      await expect(
        createReminder(p(stranger), {
          title: "x",
          visibility: "GROUP",
          groupId: group.id,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejects tags from another user", async () => {
      const a = await mk("ta");
      const b = await mk("tb");
      const aTag = await createTag(p(a), {
        name: "private",
        iconName: "x",
        color: "#aaaaaa",
      });
      await expect(
        createReminder(p(b), {
          title: "x",
          visibility: "PRIVATE",
          tagIds: [aTag.id],
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe("private/group isolation", () => {
    it("private reminder is invisible to other users", async () => {
      const a = await mk("a");
      const b = await mk("b");
      const r = await createReminder(p(a), {
        title: "secret",
        visibility: "PRIVATE",
      });
      await expect(getReminder(p(b), r.id)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      // And it doesn't show in b's list
      const bList = await listReminders(p(b), "private");
      expect(bList.find((x) => x.id === r.id)).toBeUndefined();
    });

    it("group reminder is invisible to non-members", async () => {
      const { member, stranger, group } = await setup();
      const r = await createReminder(p(member), {
        title: "团跑",
        visibility: "GROUP",
        groupId: group.id,
      });
      await expect(
        getReminder(p(stranger), r.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("listReminders", () => {
    it("scope=private shows only the caller's private reminders", async () => {
      const a = await mk("a");
      const b = await mk("b");
      await createReminder(p(a), { title: "a1", visibility: "PRIVATE" });
      await createReminder(p(a), { title: "a2", visibility: "PRIVATE" });
      await createReminder(p(b), { title: "b1", visibility: "PRIVATE" });
      const list = await listReminders(p(a), "private");
      expect(list.map((r) => r.title).sort()).toEqual(["a1", "a2"]);
    });

    it("scope=today combines private + groups the user is in, excludes deleted", async () => {
      const { owner, member, stranger, group } = await setup();
      const ownPriv = await createReminder(p(owner), {
        title: "ownPrivate",
        visibility: "PRIVATE",
      });
      const groupReminder = await createReminder(p(member), {
        title: "groupOne",
        visibility: "GROUP",
        groupId: group.id,
      });
      const strangerPriv = await createReminder(p(stranger), {
        title: "strangerPriv",
        visibility: "PRIVATE",
      });
      // Soft-delete the private one
      await deleteReminder(p(owner), ownPriv.id);

      const ownerToday = await listReminders(p(owner), "today");
      const ids = ownerToday.map((r) => r.id);
      expect(ids).toContain(groupReminder.id);
      expect(ids).not.toContain(ownPriv.id); // deleted
      expect(ids).not.toContain(strangerPriv.id); // not theirs
    });

    it("scope=group:UUID requires membership", async () => {
      const { stranger, group } = await setup();
      await expect(
        listReminders(p(stranger), `group:${group.id}` as never),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("update / delete", () => {
    it("only creator (or group owner for group reminders) can edit", async () => {
      const { owner, member, group } = await setup();
      const r = await createReminder(p(member), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      const edited = await updateReminder(p(member), r.id, {
        title: "edited by creator",
      });
      expect(edited.title).toBe("edited by creator");
      // Owner can also edit (group owner override)
      const edited2 = await updateReminder(p(owner), r.id, {
        title: "edited by owner",
      });
      expect(edited2.title).toBe("edited by owner");
    });

    it("non-creator/non-owner member cannot edit", async () => {
      const owner = await mk("owner");
      const m1 = await mk("m1");
      const m2 = await mk("m2");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.createMany({
        data: [
          { groupId: group.id, userId: m1.id, role: "MEMBER" },
          { groupId: group.id, userId: m2.id, role: "MEMBER" },
        ],
      });
      const r = await createReminder(p(m1), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      await expect(
        updateReminder(p(m2), r.id, { title: "y" }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("delete is soft (isDeleted=true) and hides from later access", async () => {
      const u = await mk("u");
      const r = await createReminder(p(u), {
        title: "x",
        visibility: "PRIVATE",
      });
      await deleteReminder(p(u), r.id);
      await expect(getReminder(p(u), r.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      // Row still in DB though
      const row = await prisma.reminder.findUnique({ where: { id: r.id } });
      expect(row?.isDeleted).toBe(true);
    });
  });

  describe("complete / skip", () => {
    it("complete creates a Completion row and flips status to DONE for non-recurring", async () => {
      const u = await mk("u");
      const r = await createReminder(p(u), {
        title: "x",
        visibility: "PRIVATE",
      });
      const c = await completeReminder(p(u), r.id, { note: "搞定" });
      expect(c.userId).toBe(u.id);
      const after = await prisma.reminder.findUniqueOrThrow({
        where: { id: r.id },
      });
      expect(after.status).toBe("DONE");
    });

    it("complete leaves status ACTIVE for recurring reminders", async () => {
      const u = await mk("u");
      const r = await createReminder(p(u), {
        title: "morning run",
        visibility: "PRIVATE",
        repeatRule: "FREQ=DAILY",
      });
      await completeReminder(p(u), r.id);
      await completeReminder(p(u), r.id);
      const after = await prisma.reminder.findUniqueOrThrow({
        where: { id: r.id },
      });
      expect(after.status).toBe("ACTIVE");
      const completions = await prisma.completion.count({
        where: { reminderId: r.id },
      });
      expect(completions).toBe(2);
    });

    it("group member (non-creator) can complete a group reminder", async () => {
      const { owner, member, group } = await setup();
      const r = await createReminder(p(owner), {
        title: "团完成",
        visibility: "GROUP",
        groupId: group.id,
      });
      await completeReminder(p(member), r.id);
      const completions = await prisma.completion.findMany({
        where: { reminderId: r.id },
      });
      expect(completions).toHaveLength(1);
      expect(completions[0].userId).toBe(member.id);
    });

    it("skip flips status to SKIPPED", async () => {
      const u = await mk("u");
      const r = await createReminder(p(u), {
        title: "x",
        visibility: "PRIVATE",
      });
      await skipReminderDay(p(u), r.id);
      const after = await prisma.reminder.findUniqueOrThrow({
        where: { id: r.id },
      });
      expect(after.status).toBe("SKIPPED");
    });
  });

  describe("claim / unclaim", () => {
    it("group member can claim and unclaim a group reminder", async () => {
      const { member, group } = await setup();
      const r = await createReminder(p(member), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      await claimReminder(p(member), r.id);
      const claims = await prisma.claim.findMany({
        where: { reminderId: r.id },
      });
      expect(claims).toHaveLength(1);

      // Idempotent: claiming again returns the existing claim
      await claimReminder(p(member), r.id);
      expect(await prisma.claim.count({ where: { reminderId: r.id } })).toBe(1);

      await unclaimReminder(p(member), r.id);
      expect(await prisma.claim.count({ where: { reminderId: r.id } })).toBe(0);
    });

    it("private reminders cannot be claimed", async () => {
      const u = await mk("u");
      const r = await createReminder(p(u), {
        title: "x",
        visibility: "PRIVATE",
      });
      await expect(claimReminder(p(u), r.id)).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });
  });

  describe("comments & reactions", () => {
    it("group member can comment and add a reaction", async () => {
      const { member, group } = await setup();
      const r = await createReminder(p(member), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      const c = await addComment(p(member), r.id, { content: "加油" });
      expect(c.content).toBe("加油");

      const reaction = await addReaction(p(member), r.id, { emoji: "👍" });
      expect(reaction.emoji).toBe("👍");
      // Same emoji twice → idempotent (returns existing)
      const reaction2 = await addReaction(p(member), r.id, { emoji: "👍" });
      expect(reaction2.id).toBe(reaction.id);
      const all = await prisma.reaction.count({ where: { reminderId: r.id } });
      expect(all).toBe(1);
    });

    it("non-member cannot comment / react on a group reminder", async () => {
      const { member, stranger, group } = await setup();
      const r = await createReminder(p(member), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      await expect(
        addComment(p(stranger), r.id, { content: "ha" }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        addReaction(p(stranger), r.id, { emoji: "🎉" }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("assertReminderAccess", () => {
    it("returns capability flags for a group reminder", async () => {
      const { owner, member, group } = await setup();
      const r = await createReminder(p(member), {
        title: "x",
        visibility: "GROUP",
        groupId: group.id,
      });
      const memCaps = await assertReminderAccess(p(member), r.id);
      expect(memCaps.isCreator).toBe(true);
      expect(memCaps.canWriteContent).toBe(true);
      const ownCaps = await assertReminderAccess(p(owner), r.id);
      expect(ownCaps.isGroupOwner).toBe(true);
      expect(ownCaps.canWriteContent).toBe(true);
    });
  });
});
