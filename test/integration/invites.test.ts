// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeInvite,
  issueGroupInvite,
  previewInvite,
} from "@/services/auth/invites";
import { createUser } from "@/services/auth/users";
import { prisma, resetDb } from "./setup-db";

async function makeOwnerAndGroup() {
  const owner = await createUser({
    email: "owner@example.com",
    password: "AaBbCc11",
    displayName: "Owner",
  });
  const group = await prisma.group.create({
    data: {
      name: "晨跑小分队",
      ownerId: owner.id,
      members: { create: { userId: owner.id, role: "OWNER" } },
    },
  });
  return { owner, group };
}

describe("group invites (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("issueGroupInvite creates a token row", async () => {
    const { owner, group } = await makeOwnerAndGroup();
    const r = await issueGroupInvite(group.id, owner.id);
    expect(r.token).toBeTypeOf("string");
    const row = await prisma.inviteToken.findUnique({ where: { token: r.token } });
    expect(row?.groupId).toBe(group.id);
    expect(row?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  describe("previewInvite", () => {
    it("returns valid preview for fresh token", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const r = await issueGroupInvite(group.id, owner.id);
      const preview = await previewInvite(r.token);
      expect(preview).toEqual({
        groupId: group.id,
        groupName: "晨跑小分队",
        inviterDisplayName: "Owner",
        status: "valid",
      });
    });

    it("returns null for unknown token", async () => {
      expect(await previewInvite("nope")).toBeNull();
    });

    it("returns null for disbanded group", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const r = await issueGroupInvite(group.id, owner.id);
      await prisma.group.update({
        where: { id: group.id },
        data: { isDisbanded: true },
      });
      expect(await previewInvite(r.token)).toBeNull();
    });

    it("flags expired and used statuses", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const r = await issueGroupInvite(group.id, owner.id);
      await prisma.inviteToken.update({
        where: { token: r.token },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect((await previewInvite(r.token))?.status).toBe("expired");

      await prisma.inviteToken.update({
        where: { token: r.token },
        data: { expiresAt: new Date(Date.now() + 60_000), usedAt: new Date() },
      });
      expect((await previewInvite(r.token))?.status).toBe("used");
    });
  });

  describe("consumeInvite", () => {
    it("adds the invitee as a MEMBER and marks the token used", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const r = await issueGroupInvite(group.id, owner.id);
      const member = await createUser({
        email: "newbie@example.com",
        password: "AaBbCc11",
        displayName: "Newbie",
      });
      const result = await consumeInvite(r.token, member.id);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.groupId).toBe(group.id);
      }

      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(membership?.role).toBe("MEMBER");
      expect(membership?.leftAt).toBeNull();

      const tokenAfter = await prisma.inviteToken.findUnique({
        where: { token: r.token },
      });
      expect(tokenAfter?.usedAt).not.toBeNull();
      expect(tokenAfter?.usedByUserId).toBe(member.id);
    });

    it("re-joins a previously left member by clearing leftAt", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const member = await createUser({
        email: "rejoin@example.com",
        password: "AaBbCc11",
        displayName: "Rejoin",
      });
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: member.id,
          role: "MEMBER",
          leftAt: new Date(),
        },
      });
      const r = await issueGroupInvite(group.id, owner.id);
      const result = await consumeInvite(r.token, member.id);
      expect(result.ok).toBe(true);
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(membership?.leftAt).toBeNull();
    });

    it("rejects expired/used/disbanded/missing tokens", async () => {
      const { owner, group } = await makeOwnerAndGroup();
      const member = await createUser({
        email: "x@example.com",
        password: "AaBbCc11",
        displayName: "X",
      });

      // missing
      expect(await consumeInvite("nope", member.id)).toEqual({
        ok: false,
        reason: "not_found",
      });

      // expired
      const expired = await issueGroupInvite(group.id, owner.id);
      await prisma.inviteToken.update({
        where: { token: expired.token },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect(await consumeInvite(expired.token, member.id)).toEqual({
        ok: false,
        reason: "expired",
      });

      // used
      const used = await issueGroupInvite(group.id, owner.id);
      await prisma.inviteToken.update({
        where: { token: used.token },
        data: { usedAt: new Date(), usedByUserId: owner.id },
      });
      expect(await consumeInvite(used.token, member.id)).toEqual({
        ok: false,
        reason: "used",
      });

      // disbanded
      const fresh = await issueGroupInvite(group.id, owner.id);
      await prisma.group.update({
        where: { id: group.id },
        data: { isDisbanded: true },
      });
      expect(await consumeInvite(fresh.token, member.id)).toEqual({
        ok: false,
        reason: "disbanded",
      });
    });
  });
});
