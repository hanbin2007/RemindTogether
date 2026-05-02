/**
 * Global search — HfL2Search overlay. Searches reminders the user can see
 * (own + group-shared), groups they're in, and other group members'
 * displayName. Plain ILIKE for now; Phase 11 may switch to Postgres FTS.
 */
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";

export interface SearchHit {
  kind: "reminder" | "group" | "person";
  id: string;
  title: string;
  sub: string | null;
  href: string;
}

export async function globalSearch(
  principal: Principal,
  query: string,
  limit = 20,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const ilike = { contains: q, mode: "insensitive" as const };
  const cap = Math.max(3, Math.floor(limit / 3));

  // Reminders the user can see.
  const reminders = await prisma.reminder.findMany({
    where: {
      isDeleted: false,
      OR: [
        { creatorId: principal.id, title: ilike },
        {
          visibility: "GROUP",
          group: { members: { some: { userId: principal.id, leftAt: null } } },
          title: ilike,
        },
      ],
    },
    select: {
      id: true,
      title: true,
      group: { select: { name: true } },
    },
    take: cap,
  });

  // Groups the user is in.
  const groups = await prisma.group.findMany({
    where: {
      isDisbanded: false,
      members: { some: { userId: principal.id, leftAt: null } },
      name: ilike,
    },
    select: { id: true, name: true, coverEmoji: true },
    take: cap,
  });

  // People who share at least one group with the user (avoids enumerating
  // strangers).
  const myGroupIds = await prisma.groupMember
    .findMany({
      where: { userId: principal.id, leftAt: null },
      select: { groupId: true },
    })
    .then((rows) => rows.map((r) => r.groupId));

  const people =
    myGroupIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: {
            id: { not: principal.id },
            displayName: ilike,
            memberships: {
              some: { groupId: { in: myGroupIds }, leftAt: null },
            },
          },
          select: { id: true, displayName: true },
          take: cap,
        });

  const hits: SearchHit[] = [
    ...reminders.map((r) => ({
      kind: "reminder" as const,
      id: r.id,
      title: r.title,
      sub: r.group?.name ? `#${r.group.name}` : "私人",
      href: `/app/reminders/${r.id}`,
    })),
    ...groups.map((g) => ({
      kind: "group" as const,
      id: g.id,
      title: `${g.coverEmoji ?? "📌"} ${g.name}`,
      sub: null,
      href: `/app/groups/${g.id}`,
    })),
    ...people.map((p) => ({
      kind: "person" as const,
      id: p.id,
      title: p.displayName,
      sub: "群成员",
      href: `/app/users/${p.id}`,
    })),
  ];

  return hits.slice(0, limit);
}
