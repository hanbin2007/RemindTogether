/**
 * Test fixtures: create users / groups / invites directly via Prisma so
 * the E2E tests don't need to import the production service modules
 * (which pull in next-auth and other tooling that doesn't play well with
 * Playwright's test transformer).
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getPrisma } from "./db";

export async function seedUser(opts: {
  email: string;
  password: string;
  displayName: string;
  emailVerified?: boolean;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 12);
  return getPrisma().user.create({
    data: {
      email: opts.email,
      passwordHash,
      displayName: opts.displayName,
      emailVerifiedAt: opts.emailVerified ? new Date() : null,
    },
  });
}

export async function seedGroupWithOwner(name: string) {
  const ownerEmail = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const owner = await seedUser({
    email: ownerEmail,
    password: "OwnerPa55!",
    displayName: "Owner",
    emailVerified: true,
  });
  const group = await getPrisma().group.create({
    data: {
      name,
      ownerId: owner.id,
      members: { create: { userId: owner.id, role: "OWNER" } },
    },
  });
  return { owner, group };
}

export async function seedInvite(groupId: string, createdById: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await getPrisma().inviteToken.create({
    data: { groupId, token, createdById, expiresAt },
  });
  return { token, expiresAt };
}
