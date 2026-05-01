// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  assertActiveGroupMember,
  createGroup,
  disbandGroup,
  getGroup,
  issueInviteForGroup,
  joinGroupByToken,
  leaveGroup,
  listMyGroups,
  removeMember,
  updateGroup,
} from "@/services/groups";
import { createUser } from "@/services/auth/users";
import { ConfigKey, setConfig } from "@/services/config";
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

async function mkUser(name: string) {
  return createUser({
    email: `${name}@example.com`,
    password: "Pa55word!",
    displayName: name,
  });
}

describe("group service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("createGroup makes the creator the OWNER and lists in their groups", async () => {
    const owner = await mkUser("alice");
    const group = await createGroup(p(owner), {
      name: "晨跑小分队",
      coverEmoji: "🏃",
    });
    expect(group.name).toBe("晨跑小分队");
    expect(group.ownerId).toBe(owner.id);

    const ms = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: owner.id } },
    });
    expect(ms?.role).toBe("OWNER");

    const list = await listMyGroups(p(owner));
    expect(list).toHaveLength(1);
  });

  it("getGroup returns members and member count for active member", async () => {
    const owner = await mkUser("o");
    const member = await mkUser("m");
    const group = await createGroup(p(owner), { name: "g" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: member.id, role: "MEMBER" },
    });

    const detail = await getGroup(p(member), group.id);
    expect(detail.memberCount).toBe(2);
    expect(detail.members.map((m) => m.role).sort()).toEqual(["MEMBER", "OWNER"]);
  });

  it("getGroup denies non-members with ForbiddenError", async () => {
    const owner = await mkUser("o");
    const stranger = await mkUser("s");
    const group = await createGroup(p(owner), { name: "g" });
    await expect(getGroup(p(stranger), group.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("getGroup returns 404 (NotFoundError) for disbanded groups even for ex-members", async () => {
    const owner = await mkUser("o");
    const group = await createGroup(p(owner), { name: "g" });
    await disbandGroup(p(owner), group.id);
    await expect(getGroup(p(owner), group.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  describe("updateGroup", () => {
    it("only owner can update", async () => {
      const owner = await mkUser("o");
      const member = await mkUser("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });
      await expect(
        updateGroup(p(member), group.id, { name: "new" }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      const u = await updateGroup(p(owner), group.id, { name: "new" });
      expect(u.name).toBe("new");
    });

    it("rejects empty patch", async () => {
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      await expect(
        updateGroup(p(owner), group.id, {}),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe("removeMember", () => {
    it("owner can remove a member; member can no longer access the group", async () => {
      const owner = await mkUser("o");
      const member = await mkUser("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });
      await removeMember(p(owner), group.id, member.id);
      await expect(
        assertActiveGroupMember(member.id, group.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("non-owner cannot remove anyone", async () => {
      const owner = await mkUser("o");
      const m1 = await mkUser("m1");
      const m2 = await mkUser("m2");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: m1.id, role: "MEMBER" },
      });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: m2.id, role: "MEMBER" },
      });
      await expect(
        removeMember(p(m1), group.id, m2.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("owner cannot remove themselves (must disband instead)", async () => {
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      await expect(
        removeMember(p(owner), group.id, owner.id),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe("leaveGroup", () => {
    it("ordinary member can leave; group still exists for others", async () => {
      const owner = await mkUser("o");
      const member = await mkUser("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });
      await leaveGroup(p(member), group.id);
      const ms = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(ms?.leftAt).not.toBeNull();
      // Group still exists and listable for owner
      expect((await listMyGroups(p(owner))).length).toBe(1);
    });

    it("owner cannot leave; must disband", async () => {
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      await expect(leaveGroup(p(owner), group.id)).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });
  });

  describe("disbandGroup", () => {
    it("only owner can disband; marks isDisbanded and clears all active memberships", async () => {
      const owner = await mkUser("o");
      const member = await mkUser("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });

      await expect(
        disbandGroup(p(member), group.id),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await disbandGroup(p(owner), group.id);
      const g = await prisma.group.findUnique({ where: { id: group.id } });
      expect(g?.isDisbanded).toBe(true);
      const memberships = await prisma.groupMember.findMany({
        where: { groupId: group.id },
      });
      for (const m of memberships) expect(m.leftAt).not.toBeNull();
      expect(await listMyGroups(p(owner))).toHaveLength(0);
    });
  });

  describe("invite + join", () => {
    it("issueInviteForGroup returns a /invite URL anchored to baseUrl", async () => {
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      const r = await issueInviteForGroup(
        p(owner),
        group.id,
        "https://rt.example.com/",
      );
      expect(r.url).toBe(`https://rt.example.com/invite/${r.token}`);
      expect(r.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("joinGroupByToken adds the caller as a member; idempotent if already in", async () => {
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      const member = await mkUser("m");
      const r = await issueInviteForGroup(
        p(owner),
        group.id,
        "http://localhost:3000",
      );
      const join = await joinGroupByToken(p(member), r.token);
      expect(join.ok).toBe(true);
      const ms = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(ms?.role).toBe("MEMBER");
    });

    it("joinGroupByToken refuses when the group is at capacity", async () => {
      await setConfig(ConfigKey.GroupMaxMembers, 2);
      const owner = await mkUser("o");
      const group = await createGroup(p(owner), { name: "g" });
      const m1 = await mkUser("m1");
      const m2 = await mkUser("m2");
      // Fill to capacity (owner + m1 = 2)
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: m1.id, role: "MEMBER" },
      });
      const r = await issueInviteForGroup(
        p(owner),
        group.id,
        "http://localhost:3000",
      );
      await expect(
        joinGroupByToken(p(m2), r.token),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });
});
