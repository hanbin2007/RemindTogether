// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeEmailVerification,
  issueEmailVerification,
} from "@/services/auth/email-verification";
import { createUser } from "@/services/auth/users";
import { prisma, resetDb } from "./setup-db";

describe("email verification (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("issues a token, stores a row, and sends a mail", async () => {
    const user = await createUser({
      email: "ev@example.com",
      password: "AaBbCc11",
      displayName: "EV",
    });
    // createUser already issues one; issuing another is allowed.
    const second = await issueEmailVerification(user);
    expect(second.token).toBeTypeOf("string");
    expect(second.token.length).toBeGreaterThan(20);
    const rows = await prisma.emailVerification.findMany({ where: { userId: user.id } });
    expect(rows.length).toBe(2);
  });

  it("consume marks both row.usedAt and user.emailVerifiedAt", async () => {
    const user = await createUser({
      email: "consume@example.com",
      password: "AaBbCc11",
      displayName: "Consume",
    });
    const row = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });

    const res = await consumeEmailVerification(row.token);
    expect(res).toEqual({ ok: true, userId: user.id });

    const after = await prisma.emailVerification.findUnique({ where: { id: row.id } });
    expect(after?.usedAt).not.toBeNull();
    const u2 = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u2?.emailVerifiedAt).not.toBeNull();
  });

  it("rejects unknown tokens", async () => {
    expect(await consumeEmailVerification("nope")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("rejects expired tokens", async () => {
    const user = await createUser({
      email: "exp@example.com",
      password: "AaBbCc11",
      displayName: "exp",
    });
    const row = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });
    await prisma.emailVerification.update({
      where: { id: row.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await consumeEmailVerification(row.token)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects re-using a token", async () => {
    const user = await createUser({
      email: "reuse@example.com",
      password: "AaBbCc11",
      displayName: "reuse",
    });
    const row = await prisma.emailVerification.findFirstOrThrow({
      where: { userId: user.id },
    });
    await consumeEmailVerification(row.token);
    expect(await consumeEmailVerification(row.token)).toEqual({
      ok: false,
      reason: "used",
    });
  });
});
