#!/usr/bin/env tsx
/**
 * Promote a user to admin by email. Run on the server (or against any
 * environment whose DATABASE_URL is in the current env).
 *
 *   pnpm exec tsx scripts/promote-admin.ts user@example.com
 *
 * Idempotent: re-running on an already-admin account is a no-op.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    console.error("usage: tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const before = await prisma.user.findUnique({ where: { email } });
    if (!before) {
      console.error(`no user with email "${email}"`);
      process.exit(2);
    }
    if (before.isAdmin) {
      console.log(`already admin: ${email}`);
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });
    console.log(`promoted ${email} (${before.id}) to admin`);
    console.log(
      "note: existing JWT cookie still says non-admin until re-login OR cache TTL expires (10s in prod).",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
