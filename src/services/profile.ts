/**
 * Public-ish profile data for one user, viewed by another.
 *
 * Privacy rule: viewer must share at least one active group with the
 * subject. Otherwise we treat them as non-existent (NotFoundError) so
 * unrelated user IDs can't be enumerated.
 */
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";

export interface PublicProfile {
  userId: string;
  displayName: string;
  /** Groups the viewer and the subject share, both still active members. */
  sharedGroups: Array<{ id: string; name: string; coverEmoji: string | null }>;
  /** Number of completions the subject made this calendar week within shared groups. */
  weeklyCompletionsInShared: number;
  /** Whether the subject is the viewer themself. */
  isSelf: boolean;
}

function startOfThisWeekUTC(): Date {
  const d = new Date();
  // Monday-based week to match the rest of the app (groups.ts uses Monday).
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff),
  );
  return monday;
}

export async function getPublicProfile(
  viewer: Principal,
  subjectId: string,
): Promise<PublicProfile> {
  const subject = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { id: true, displayName: true, isBanned: true },
  });
  if (!subject || subject.isBanned) throw new NotFoundError("user");

  const isSelf = viewer.id === subjectId;

  // Find groups both are active members of.
  const sharedRaw = isSelf
    ? await prisma.group.findMany({
        where: {
          isDisbanded: false,
          members: { some: { userId: subject.id, leftAt: null } },
        },
        select: { id: true, name: true, coverEmoji: true },
      })
    : await prisma.group.findMany({
        where: {
          isDisbanded: false,
          AND: [
            { members: { some: { userId: viewer.id, leftAt: null } } },
            { members: { some: { userId: subject.id, leftAt: null } } },
          ],
        },
        select: { id: true, name: true, coverEmoji: true },
        orderBy: { name: "asc" },
      });

  if (!isSelf && sharedRaw.length === 0) {
    // Don't leak existence of unrelated users.
    throw new NotFoundError("user");
  }

  const weekStart = startOfThisWeekUTC();
  const weeklyCompletionsInShared =
    sharedRaw.length === 0
      ? 0
      : await prisma.completion.count({
          where: {
            userId: subject.id,
            completedAt: { gte: weekStart },
            reminder: {
              groupId: { in: sharedRaw.map((g) => g.id) },
            },
          },
        });

  return {
    userId: subject.id,
    displayName: subject.displayName,
    sharedGroups: sharedRaw,
    weeklyCompletionsInShared,
    isSelf,
  };
}
