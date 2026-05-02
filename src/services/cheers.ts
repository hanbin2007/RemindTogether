/**
 * "想搭把手" — soft poke from the leaderboard. Exists so the UI button on
 * a low-doneCount member doesn't have to compose a poke from scratch:
 * it picks the right reminder + sets a NO_RUSH tone, then routes through
 * the regular sendPoke pipeline (gets quota, DND, link policy for free).
 */
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";
import { assertActiveGroupMember } from "@/services/groups";
import { sendPoke } from "@/services/pokes";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";

export interface CheerUpInput {
  toUserId: string;
  groupId: string;
  /** Optional override for the message body. */
  message?: string;
}

export async function cheerUp(
  principal: Principal,
  input: CheerUpInput,
): Promise<{ pokeId: string; remaining: number }> {
  if (input.toUserId === principal.id) {
    throw new BadRequestError("self_cheer", "想给自己加油，直接做就行 ✨");
  }
  // Both must be active members of the group.
  await assertActiveGroupMember(principal.id, input.groupId);
  await assertActiveGroupMember(input.toUserId, input.groupId);

  // Pick the most recent assigned-but-not-done reminder in this group
  // for the target — that's the one we want to wave at.
  const candidate = await prisma.reminder.findFirst({
    where: {
      groupId: input.groupId,
      isDeleted: false,
      status: { not: "DONE" },
      OR: [
        { assigneeId: input.toUserId },
        { claims: { some: { userId: input.toUserId } } },
      ],
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true },
  });
  if (!candidate) {
    throw new NotFoundError("no_target_reminder");
  }

  const result = await sendPoke(principal, {
    toUserId: input.toUserId,
    reminderId: candidate.id,
    tone: "NO_RUSH",
    message: input.message ?? `想搭把手：${candidate.title}`,
  });
  return { pokeId: result.poke.id, remaining: result.quota.remaining };
}
