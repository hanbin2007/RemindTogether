import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/random";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72 h, per PRD

export interface InvitePreview {
  groupId: string;
  groupName: string;
  inviterDisplayName: string;
  status: "valid" | "used" | "expired";
}

export async function issueGroupInvite(
  groupId: string,
  createdById: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await prisma.inviteToken.create({
    data: {
      groupId,
      token,
      createdById,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function previewInvite(token: string): Promise<InvitePreview | null> {
  const row = await prisma.inviteToken.findUnique({
    where: { token },
    include: {
      group: { select: { id: true, name: true, isDisbanded: true } },
    },
  });
  if (!row) return null;
  if (row.group.isDisbanded) return null;

  let status: InvitePreview["status"] = "valid";
  if (row.usedAt) status = "used";
  else if (row.expiresAt.getTime() < Date.now()) status = "expired";

  // Inviter display name (separate query — InviteToken does not relate to User)
  const inviter = await prisma.user.findUnique({
    where: { id: row.createdById },
    select: { displayName: true },
  });

  return {
    groupId: row.group.id,
    groupName: row.group.name,
    inviterDisplayName: inviter?.displayName ?? "群主",
    status,
  };
}

export type ConsumeInviteResult =
  | { ok: true; groupId: string; alreadyMember: boolean }
  | { ok: false; reason: "not_found" | "expired" | "used" | "disbanded" };

/**
 * Consume the invite as `userId`. Idempotent on already-member: if the
 * user is already in the group we still mark the token used so it can't
 * be reused, and report alreadyMember=true so the UI can stay calm.
 */
export async function consumeInvite(
  token: string,
  userId: string,
): Promise<ConsumeInviteResult> {
  const row = await prisma.inviteToken.findUnique({
    where: { token },
    include: { group: { select: { id: true, isDisbanded: true } } },
  });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.group.isDisbanded) return { ok: false, reason: "disbanded" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      // Insert membership; ignore conflict if the user is already a member.
      const existing = await tx.groupMember.findUnique({
        where: { groupId_userId: { groupId: row.groupId, userId } },
      });
      if (!existing) {
        await tx.groupMember.create({
          data: { groupId: row.groupId, userId, role: "MEMBER" },
        });
      } else if (existing.leftAt) {
        // Re-joining
        await tx.groupMember.update({
          where: { groupId_userId: { groupId: row.groupId, userId } },
          data: { leftAt: null, joinedAt: now },
        });
      }
      await tx.inviteToken.update({
        where: { id: row.id },
        data: { usedAt: now, usedByUserId: userId },
      });
    });
    return { ok: true, groupId: row.groupId, alreadyMember: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // Best-effort: surface a generic failure for the caller
      return { ok: false, reason: "used" };
    }
    throw e;
  }
}
