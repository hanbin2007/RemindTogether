// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  EmailAlreadyRegistered,
  createUser,
  verifyCredentials,
} from "@/services/auth/users";
import { prisma, resetDb } from "./setup-db";

describe("user service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("createUser persists the user, hashes password, and emits a verification mail", async () => {
    const user = await createUser({
      email: "Foo@Example.com ",
      password: "Pa55word!",
      displayName: " Foo ",
      timezone: "Asia/Shanghai",
    });

    expect(user.email).toBe("foo@example.com"); // normalised
    expect(user.displayName).toBe("Foo"); // trimmed
    expect(user.timezone).toBe("Asia/Shanghai");
    expect(user.passwordHash).not.toBe("Pa55word!");
    expect(user.passwordHash.startsWith("$2")).toBe(true);
    expect(user.emailVerifiedAt).toBeNull();

    const verifications = await prisma.emailVerification.findMany({
      where: { userId: user.id },
    });
    expect(verifications).toHaveLength(1);
    expect(verifications[0].usedAt).toBeNull();
    expect(verifications[0].expiresAt.getTime()).toBeGreaterThan(Date.now());

    const mails = await prisma.mailLog.findMany({
      where: { toAddress: "foo@example.com" },
    });
    expect(mails).toHaveLength(1);
    expect(mails[0].category).toBe("EMAIL_VERIFICATION");
    expect(mails[0].body).toContain("/auth/verify-email?token=");
    expect(mails[0].refId).toBe(verifications[0].id);
  });

  it("rejects duplicate emails with EmailAlreadyRegistered", async () => {
    await createUser({
      email: "dup@example.com",
      password: "Pa55word!",
      displayName: "first",
    });
    await expect(
      createUser({
        email: "DUP@example.com",
        password: "Other55Pwd",
        displayName: "second",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegistered);
  });

  describe("verifyCredentials", () => {
    it("returns the principal on correct password", async () => {
      await createUser({
        email: "alice@example.com",
        password: "AaBbCc11",
        displayName: "Alice",
      });
      const r = await verifyCredentials({
        email: "alice@example.com",
        password: "AaBbCc11",
      });
      expect(r).not.toBeNull();
      expect(r?.email).toBe("alice@example.com");
      expect(r?.displayName).toBe("Alice");
      expect(r?.isAdmin).toBe(false);
    });

    it("returns null on wrong password", async () => {
      await createUser({
        email: "bob@example.com",
        password: "AaBbCc11",
        displayName: "Bob",
      });
      const r = await verifyCredentials({
        email: "bob@example.com",
        password: "wrongPass1",
      });
      expect(r).toBeNull();
    });

    it("returns null for unknown email", async () => {
      const r = await verifyCredentials({
        email: "nobody@example.com",
        password: "AaBbCc11",
      });
      expect(r).toBeNull();
    });

    it("returns null for banned users even with correct password", async () => {
      const u = await createUser({
        email: "banned@example.com",
        password: "AaBbCc11",
        displayName: "Banned",
      });
      await prisma.user.update({
        where: { id: u.id },
        data: { isBanned: true, bannedReason: "test" },
      });
      const r = await verifyCredentials({
        email: "banned@example.com",
        password: "AaBbCc11",
      });
      expect(r).toBeNull();
    });
  });
});
