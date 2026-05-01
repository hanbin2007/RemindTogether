/**
 * Shared helpers for integration tests that talk to a real PostgreSQL.
 *
 * These tests run against the `reminder_test` database. Each test should
 * call {@link resetDb} in a `beforeEach` to start from an empty slate.
 *
 * Tunnel from sandbox → server PG must be up (port 15432). The
 * scripts/dev-helpers/forward-pg.sh helper handles that for you, or run
 * `ssh -fNT -L 15432:127.0.0.1:5432 rt` once.
 */
import { prisma } from "@/lib/prisma";

const TABLES = [
  // Order matters for FK; child rows first.
  "MailLog",
  "EmailVerification",
  "PasswordReset",
  "InviteToken",
  "GroupMember",
  "Group",
  "User",
  "Config",
] as const;

export async function resetDb() {
  await prisma.$transaction(
    TABLES.map((t) =>
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`),
    ),
  );
}

export { prisma };
