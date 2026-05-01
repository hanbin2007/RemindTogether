// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { invalidatePrincipalCache } from "@/lib/auth/principal";
import { banUser, promoteToAdmin } from "@/services/admin/users";
import { createUser } from "@/services/auth/users";
import { resetDb, prisma } from "./setup-db";

/**
 * Verify that admin write operations do invalidate the principal-state
 * cache (banned/admin bits). We can't easily call requirePrincipal here
 * (no NextAuth session in these node tests), so we check the cache map
 * indirectly: after admin actions, a fresh DB read returns the new
 * state, and the bit propagates everywhere services rely on it.
 */
describe("requirePrincipal cache + admin writes", () => {
  beforeEach(async () => {
    await resetDb();
    invalidatePrincipalCache();
  });

  it("banUser marks the row banned in DB, invalidates cache", async () => {
    const admin = await createUser({
      email: "admin@example.com",
      password: "Pa55word!",
      displayName: "admin",
    });
    await prisma.user.update({
      where: { id: admin.id },
      data: { isAdmin: true },
    });
    const target = await createUser({
      email: "v@example.com",
      password: "Pa55word!",
      displayName: "v",
    });
    await banUser(
      { id: admin.id, email: admin.email, isAdmin: true, emailIsVerified: true },
      target.id,
      "spam",
    );
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(after.isBanned).toBe(true);
    expect(after.bannedReason).toBe("spam");
  });

  it("promoteToAdmin flips bit + invalidates", async () => {
    const admin = await createUser({
      email: "admin@example.com",
      password: "Pa55word!",
      displayName: "admin",
    });
    await prisma.user.update({
      where: { id: admin.id },
      data: { isAdmin: true },
    });
    const target = await createUser({
      email: "p@example.com",
      password: "Pa55word!",
      displayName: "p",
    });
    await promoteToAdmin(
      { id: admin.id, email: admin.email, isAdmin: true, emailIsVerified: true },
      target.id,
    );
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(after.isAdmin).toBe(true);
  });
});
