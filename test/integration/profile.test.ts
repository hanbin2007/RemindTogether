// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { getPublicProfile } from "@/services/profile";
import { createGroup } from "@/services/groups";
import { createReminder, completeReminder } from "@/services/reminders";
import { createUser } from "@/services/auth/users";
import { NotFoundError } from "@/lib/api/errors";
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

describe("profile service · getPublicProfile (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns shared-group profile when viewer + subject share a group", async () => {
    const owner = await mk("o");
    const member = await mk("m");
    const group = await createGroup(p(owner), { name: "晨跑", coverEmoji: "🏃" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: member.id, role: "MEMBER" },
    });
    const r = await getPublicProfile(p(owner), member.id);
    expect(r.userId).toBe(member.id);
    expect(r.displayName).toBe("m");
    expect(r.isSelf).toBe(false);
    expect(r.sharedGroups.length).toBe(1);
    expect(r.sharedGroups[0].id).toBe(group.id);
    expect(r.sharedGroups[0].name).toBe("晨跑");
  });

  it("404s when viewer has no shared group with subject", async () => {
    const a = await mk("a");
    const b = await mk("b");
    await expect(getPublicProfile(p(a), b.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("404s for non-existent user", async () => {
    const a = await mk("only");
    await expect(
      getPublicProfile(
        p(a),
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404s for banned user even if a shared group exists", async () => {
    const owner = await mk("ow");
    const banned = await mk("bn");
    const group = await createGroup(p(owner), { name: "g" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: banned.id, role: "MEMBER" },
    });
    await prisma.user.update({
      where: { id: banned.id },
      data: { isBanned: true },
    });
    await expect(
      getPublicProfile(p(owner), banned.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("isSelf=true when viewer === subject; sharedGroups returns all my groups", async () => {
    const me = await mk("self");
    const g = await createGroup(p(me), { name: "我的群" });
    const r = await getPublicProfile(p(me), me.id);
    expect(r.isSelf).toBe(true);
    expect(r.sharedGroups.map((s) => s.id)).toContain(g.id);
  });

  it("counts this-week completions only inside shared groups", async () => {
    const owner = await mk("ow2");
    const member = await mk("mb2");
    const sharedGroup = await createGroup(p(owner), { name: "shared" });
    await prisma.groupMember.create({
      data: { groupId: sharedGroup.id, userId: member.id, role: "MEMBER" },
    });
    // Member's own private reminders (NOT in shared group) shouldn't count.
    const privateRem = await createReminder(p(member), {
      title: "私人事",
      visibility: "PRIVATE",
    });
    await completeReminder(p(member), privateRem.id);
    // A reminder inside the shared group SHOULD count.
    const groupRem = await createReminder(p(member), {
      title: "群内事",
      visibility: "GROUP",
      groupId: sharedGroup.id,
    });
    await completeReminder(p(member), groupRem.id);

    const r = await getPublicProfile(p(owner), member.id);
    expect(r.weeklyCompletionsInShared).toBe(1);
  });

  it("excludes disbanded shared groups", async () => {
    const owner = await mk("ow3");
    const other = await mk("ot3");
    const group = await createGroup(p(owner), { name: "wasGroup" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: other.id, role: "MEMBER" },
    });
    await prisma.group.update({
      where: { id: group.id },
      data: { isDisbanded: true },
    });
    await expect(
      getPublicProfile(p(owner), other.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("excludes shared group if subject left it", async () => {
    const owner = await mk("ow4");
    const left = await mk("lf4");
    const g = await createGroup(p(owner), { name: "left-grp" });
    await prisma.groupMember.create({
      data: {
        groupId: g.id,
        userId: left.id,
        role: "MEMBER",
        leftAt: new Date(),
      },
    });
    await expect(
      getPublicProfile(p(owner), left.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
