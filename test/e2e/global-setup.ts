import { PrismaClient } from "@prisma/client";

/**
 * Truncate auth/group tables once before the suite so each run starts
 * clean. Skipped when targeting the public site (we don't blow away
 * production data).
 *
 * Hard guard: refuses to run unless the DATABASE_URL points at a database
 * whose name contains `_test` (e.g. `reminder_test`). This protects
 * `reminder_prod` even if someone accidentally invokes Playwright on the
 * production server.
 */
export default async function globalSetup() {
  if (process.env.E2E_BASE_URL) return;
  const dbUrl = process.env.DATABASE_URL ?? "";
  const dbName = dbUrl.match(/\/([^/?]+)(\?|$)/)?.[1] ?? "";
  if (!dbName.includes("_test")) {
    throw new Error(
      `[e2e/global-setup] refusing to TRUNCATE: DATABASE_URL targets "${dbName || "<unknown>"}". E2E only runs against a *_test database. Set DATABASE_URL to your test DB or set E2E_BASE_URL to skip.`,
    );
  }
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "Attachment","Notification","MailLog","EmailVerification","PasswordReset","InviteToken","GroupMember","Group","User","Config" RESTART IDENTITY CASCADE`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
