// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  adminDisbandGroup,
  adminRemoveMember,
  adminTransferOwner,
} from "@/services/admin/groups";
import { adminSetConfig, listConfig } from "@/services/admin/config";
import {
  dismissReport,
  listReports,
  resolveReport,
} from "@/services/admin/reports";
import { createReport } from "@/services/reports";
import {
  adminSoftDeleteReminder,
  adminUndeleteReminder,
} from "@/services/admin/reminders";
import { createGroup } from "@/services/groups";
import { createReminder } from "@/services/reminders";
import { createUser } from "@/services/auth/users";
import { ConfigKey, getConfigBool, getConfigInt } from "@/services/config";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import { resetDb, prisma } from "./setup-db";

function p(u: { id: string; email: string }): Principal {
  return { id: u.id, email: u.email, isAdmin: true, emailIsVerified: true };
}

async function mk(name: string) {
  return createUser({
    email: `${name}@example.com`,
    password: "Pa55word!",
    displayName: name,
  });
}

describe("admin services — groups + config + reports + reminders", () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe("adminDisbandGroup", () => {
    it("disbands any group + clears active memberships + audits", async () => {
      const admin = await mk("admin");
      const owner = await mk("owner");
      const member = await mk("member");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });

      await adminDisbandGroup(p(admin), group.id);

      const after = await prisma.group.findUniqueOrThrow({
        where: { id: group.id },
      });
      expect(after.isDisbanded).toBe(true);
      const memberships = await prisma.groupMember.findMany({
        where: { groupId: group.id },
      });
      for (const m of memberships) expect(m.leftAt).not.toBeNull();
      const audit = await prisma.adminLog.findFirstOrThrow({
        where: { action: "disband_group", targetId: group.id },
      });
      expect(audit.adminId).toBe(admin.id);
    });
  });

  describe("adminRemoveMember", () => {
    it("removes a non-owner member", async () => {
      const admin = await mk("admin");
      const owner = await mk("o");
      const member = await mk("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });
      await adminRemoveMember(p(admin), group.id, member.id);
      const ms = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(ms?.leftAt).not.toBeNull();
    });
    it("refuses to remove the owner directly", async () => {
      const admin = await mk("admin");
      const owner = await mk("o");
      const group = await createGroup(p(owner), { name: "g" });
      await expect(
        adminRemoveMember(p(admin), group.id, owner.id),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe("adminTransferOwner", () => {
    it("transfers OWNER role to an existing active member", async () => {
      const admin = await mk("admin");
      const owner = await mk("o");
      const member = await mk("m");
      const group = await createGroup(p(owner), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: member.id, role: "MEMBER" },
      });
      await adminTransferOwner(p(admin), group.id, member.id);
      const after = await prisma.group.findUniqueOrThrow({
        where: { id: group.id },
      });
      expect(after.ownerId).toBe(member.id);
      const newOwnerMs = await prisma.groupMember.findUniqueOrThrow({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
      });
      expect(newOwnerMs.role).toBe("OWNER");
      const oldOwnerMs = await prisma.groupMember.findUniqueOrThrow({
        where: { groupId_userId: { groupId: group.id, userId: owner.id } },
      });
      expect(oldOwnerMs.role).toBe("MEMBER");
    });
  });

  describe("config", () => {
    it("listConfig returns every known key with current+default", async () => {
      const entries = await listConfig();
      const keys = entries.map((e) => e.key);
      expect(keys).toContain(ConfigKey.PokeDailyLimitPerRecipient);
      expect(keys).toContain(ConfigKey.RequireEmailVerification);
    });

    it("adminSetConfig writes value, audit row, and getConfig* sees it", async () => {
      const admin = await mk("admin");
      await adminSetConfig(
        p(admin),
        ConfigKey.PokeDailyLimitPerRecipient,
        "5",
      );
      expect(
        await getConfigInt(ConfigKey.PokeDailyLimitPerRecipient),
      ).toBe(5);
      await adminSetConfig(p(admin), ConfigKey.RequireEmailVerification, "true");
      expect(
        await getConfigBool(ConfigKey.RequireEmailVerification),
      ).toBe(true);
      const audit = await prisma.adminLog.findMany({
        where: { action: "update_config" },
      });
      expect(audit.length).toBe(2);
    });

    it("adminSetConfig rejects unknown keys", async () => {
      const admin = await mk("admin");
      await expect(
        adminSetConfig(p(admin), "garbage.key", "foo"),
      ).rejects.toBeInstanceOf(BadRequestError);
    });
  });

  describe("reports", () => {
    it("user files report on a reminder they can see; admin resolves it", async () => {
      const admin = await mk("admin");
      const reporter = await mk("reporter");
      const author = await mk("author");
      // Group reminder visible to both reporter and author
      const group = await createGroup(p(author), { name: "g" });
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: reporter.id, role: "MEMBER" },
      });
      const reminder = await createReminder(p(author), {
        title: "bad title",
        visibility: "GROUP",
        groupId: group.id,
      });

      const report = await createReport(
        { id: reporter.id, email: reporter.email, isAdmin: false, emailIsVerified: true },
        {
          contentType: "REMINDER",
          contentId: reminder.id,
          reason: "spam",
        },
      );
      expect(report.status).toBe("PENDING");

      const list = await listReports({ status: "PENDING", limit: 10 });
      expect(list.find((r) => r.id === report.id)).toBeTruthy();

      const resolved = await resolveReport(p(admin), report.id, "已下架");
      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.resolvedById).toBe(admin.id);
      expect(resolved.adminNote).toBe("已下架");
    });

    it("user can't report a private reminder they don't own", async () => {
      const stranger = await mk("stranger");
      const owner = await mk("owner");
      const reminder = await createReminder(p(owner), {
        title: "private",
        visibility: "PRIVATE",
      });
      await expect(
        createReport(
          { id: stranger.id, email: stranger.email, isAdmin: false, emailIsVerified: true },
          {
            contentType: "REMINDER",
            contentId: reminder.id,
            reason: "x",
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("dismissReport flags DISMISSED", async () => {
      const admin = await mk("admin");
      const reporter = await mk("rep");
      const author = await mk("auth");
      const reminder = await createReminder(p(author), {
        title: "x",
        visibility: "PRIVATE",
      });
      await prisma.report.create({
        data: {
          reporterId: reporter.id,
          contentType: "REMINDER",
          contentId: reminder.id,
          reason: "n/a",
        },
      });
      const list = await listReports({ status: "PENDING", limit: 10 });
      const r = list[0];
      await dismissReport(p(admin), r.id, "误报");
      const after = await prisma.report.findUniqueOrThrow({
        where: { id: r.id },
      });
      expect(after.status).toBe("DISMISSED");
    });
  });

  describe("reminders", () => {
    it("admin soft-delete + undelete", async () => {
      const admin = await mk("admin");
      const author = await mk("auth");
      const r = await createReminder(p(author), {
        title: "x",
        visibility: "PRIVATE",
      });
      await adminSoftDeleteReminder(p(admin), r.id);
      const a = await prisma.reminder.findUniqueOrThrow({ where: { id: r.id } });
      expect(a.isDeleted).toBe(true);
      await adminUndeleteReminder(p(admin), r.id);
      const b = await prisma.reminder.findUniqueOrThrow({ where: { id: r.id } });
      expect(b.isDeleted).toBe(false);
    });

    it("undelete on missing reminder is 404", async () => {
      const admin = await mk("admin");
      await expect(
        adminUndeleteReminder(p(admin), "00000000-0000-0000-0000-000000000000"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
