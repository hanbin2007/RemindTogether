// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  banUser,
  demoteFromAdmin,
  forceVerifyEmail,
  promoteToAdmin,
  unbanUser,
} from "@/services/admin/users";
import { createUser } from "@/services/auth/users";
import { invalidatePrincipalCache } from "@/lib/auth/principal";
import { BadRequestError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import { resetDb, prisma } from "./setup-db";

function p(u: { id: string; email: string }, isAdmin = true): Principal {
  return { id: u.id, email: u.email, isAdmin, emailIsVerified: true };
}

async function mk(name: string, isAdmin = false) {
  const u = await createUser({
    email: `${name}@example.com`,
    password: "Pa55word!",
    displayName: name,
  });
  if (isAdmin) {
    await prisma.user.update({
      where: { id: u.id },
      data: { isAdmin: true },
    });
  }
  return u;
}

describe("admin users service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    invalidatePrincipalCache();
  });

  it("banUser sets isBanned + reason and writes AdminLog", async () => {
    const admin = await mk("admin", true);
    const target = await mk("victim");
    const updated = await banUser(p(admin), target.id, "spam");
    expect(updated.isBanned).toBe(true);
    expect(updated.bannedReason).toBe("spam");
    const audit = await prisma.adminLog.findMany({
      where: { adminId: admin.id, action: "ban_user" },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0].targetId).toBe(target.id);
  });

  it("banUser refuses self-ban", async () => {
    const admin = await mk("admin", true);
    await expect(
      banUser(p(admin), admin.id, "x"),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("unbanUser clears the ban + audits", async () => {
    const admin = await mk("admin", true);
    const target = await mk("victim");
    await banUser(p(admin), target.id);
    const updated = await unbanUser(p(admin), target.id);
    expect(updated.isBanned).toBe(false);
    expect(updated.bannedReason).toBeNull();
  });

  it("promoteToAdmin / demoteFromAdmin happy path", async () => {
    const admin = await mk("admin", true);
    const target = await mk("victim");
    await promoteToAdmin(p(admin), target.id);
    const a = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(a.isAdmin).toBe(true);
    // Need at least 2 admins for the demote check; we have admin + target now
    await demoteFromAdmin(p(admin), target.id);
    const b = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(b.isAdmin).toBe(false);
  });

  it("demoteFromAdmin refuses self", async () => {
    const admin = await mk("admin", true);
    await mk("co-admin", true);
    await expect(
      demoteFromAdmin(p(admin), admin.id),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("demoteFromAdmin refuses last admin", async () => {
    const admin = await mk("admin", true);
    const target = await mk("co-admin", true);
    // Demote target → only one admin left
    await demoteFromAdmin(p(admin), target.id);
    const target2 = await mk("co-admin-2", true);
    // Now there are admin + target2 again. Pretend admin tries to demote
    // target2; that would leave admin alone, but admin can self-leave so
    // it's fine. The "last admin" guard fires only when fewer than 2
    // active admins would remain.
    await demoteFromAdmin(p(admin), target2.id);
    // Now only `admin` is admin. Trying to promote target then demote
    // admin should NOT be possible (would leave zero).
    await promoteToAdmin(p(admin), target.id);
    // Demote target again — fine, leaves only admin
    await demoteFromAdmin(p(admin), target.id);
    // Now zero co-admins. Demoting admin self is blocked by self-check.
    // To exercise the last-admin guard explicitly, attempt to demote
    // admin via a different admin path? We can't create a new admin to
    // do it; but we can directly verify the guard by setting the count
    // to 1 and trying to demote admin from admin.
    // Promote target one more time, then admin demotes target — that's
    // fine. To trigger last_admin we'd need 2 admins where one tries to
    // demote the other AND admin is banned (count of unbanned admins
    // matters). Set target1 admin + ban admin, then try to demote target.
    await promoteToAdmin(p(admin), target.id);
    await prisma.user.update({
      where: { id: admin.id },
      data: { isBanned: true },
    });
    // Active admin count = 1 (target). Demoting target should now be blocked.
    invalidatePrincipalCache();
    await expect(
      demoteFromAdmin(p(admin), target.id),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("forceVerifyEmail flips emailVerifiedAt", async () => {
    const admin = await mk("admin", true);
    const target = await mk("v");
    expect(target.emailVerifiedAt).not.toBeNull(); // requireEmailVerification default OFF
    // Reset to null to exercise the flip
    await prisma.user.update({
      where: { id: target.id },
      data: { emailVerifiedAt: null },
    });
    const updated = await forceVerifyEmail(p(admin), target.id);
    expect(updated.emailVerifiedAt).not.toBeNull();
  });
});
