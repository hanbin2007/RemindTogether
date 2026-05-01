// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumePasswordReset,
  requestPasswordReset,
} from "@/services/auth/password-reset";
import { createUser, verifyCredentials } from "@/services/auth/users";
import { prisma, resetDb } from "./setup-db";

describe("password reset (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("requestPasswordReset for unknown email is a no-op (no enumeration)", async () => {
    await requestPasswordReset("nobody@example.com");
    expect(await prisma.passwordReset.count()).toBe(0);
    expect(await prisma.mailLog.count()).toBe(0);
  });

  it("requestPasswordReset for known email creates a row + mail", async () => {
    await createUser({
      email: "pr@example.com",
      password: "AaBbCc11",
      displayName: "PR",
    });
    await requestPasswordReset("pr@example.com");
    const rows = await prisma.passwordReset.findMany();
    expect(rows.length).toBe(1);
    const mails = await prisma.mailLog.findMany({
      where: { category: "PASSWORD_RESET" },
    });
    expect(mails.length).toBe(1);
    expect(mails[0].body).toContain(`/auth/reset?token=`);
  });

  it("consume successfully changes the password and invalidates other tokens", async () => {
    const user = await createUser({
      email: "pr2@example.com",
      password: "AaBbCc11",
      displayName: "PR2",
    });
    await requestPasswordReset(user.email);
    await requestPasswordReset(user.email); // two outstanding tokens
    const tokens = await prisma.passwordReset.findMany({ where: { userId: user.id } });
    expect(tokens.length).toBe(2);

    const r = await consumePasswordReset(tokens[0].token, "BrandNew99");
    expect(r).toEqual({ ok: true, userId: user.id });

    // Old creds rejected, new creds accepted
    expect(
      await verifyCredentials({ email: user.email, password: "AaBbCc11" }),
    ).toBeNull();
    expect(
      await verifyCredentials({ email: user.email, password: "BrandNew99" }),
    ).not.toBeNull();

    // Other outstanding token is auto-invalidated
    const other = await prisma.passwordReset.findUnique({ where: { id: tokens[1].id } });
    expect(other?.usedAt).not.toBeNull();
  });

  it("rejects expired and used tokens", async () => {
    const user = await createUser({
      email: "pr3@example.com",
      password: "AaBbCc11",
      displayName: "PR3",
    });
    await requestPasswordReset(user.email);
    const row = await prisma.passwordReset.findFirstOrThrow({
      where: { userId: user.id },
    });
    await prisma.passwordReset.update({
      where: { id: row.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await consumePasswordReset(row.token, "BrandNew99")).toEqual({
      ok: false,
      reason: "expired",
    });

    // Reset expiresAt so we can mark it used and verify "used" branch
    await prisma.passwordReset.update({
      where: { id: row.id },
      data: { expiresAt: new Date(Date.now() + 60_000), usedAt: new Date() },
    });
    expect(await consumePasswordReset(row.token, "BrandNew99")).toEqual({
      ok: false,
      reason: "used",
    });
  });

  it("rejects unknown tokens", async () => {
    expect(await consumePasswordReset("nope", "BrandNew99")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});
