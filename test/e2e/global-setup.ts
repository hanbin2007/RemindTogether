import { PrismaClient } from "@prisma/client";

/**
 * Truncate auth/group tables once before the suite so each run starts
 * clean. Skipped when targeting the public site (we don't blow away
 * production data).
 */
export default async function globalSetup() {
  if (process.env.E2E_BASE_URL) return;
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "MailLog","EmailVerification","PasswordReset","InviteToken","GroupMember","Group","User" RESTART IDENTITY CASCADE`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
