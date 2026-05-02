import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { listMyGroups, getGroupFriction } from "@/services/groups";
import { PageShell } from "@/components/hf";
import {
  HfGroups,
  type HfGroupCard,
} from "@/components/hf/screens/HfGroups";

export const dynamic = "force-dynamic";

const TINTS = [
  "#FFE9C9",
  "#E5D5F2",
  "#CDE7F0",
  "#D5E8D4",
  "#FCD5CE",
  "#F4E1B5",
  "#E2E2E2",
];

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const groups = await listMyGroups(principal);

  // Decorate each group with: members count, today done count, unread poke
  // count attached to a reminder in that group, and the friction ribbon.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const decorated = await Promise.all(
    groups.map(async (g) => {
      const [memberCount, todayDoneCount, totalToday, unreadPokes, friction] =
        await Promise.all([
          prisma.groupMember.count({
            where: { groupId: g.id, leftAt: null },
          }),
          prisma.completion.count({
            where: {
              completedAt: { gte: todayStart, lt: todayEnd },
              reminder: { groupId: g.id },
            },
          }),
          prisma.reminder.count({
            where: {
              groupId: g.id,
              isDeleted: false,
              OR: [
                { dueAt: null },
                { dueAt: { gte: todayStart, lt: todayEnd } },
              ],
            },
          }),
          prisma.poke.count({
            where: {
              toId: principal.id,
              readAt: null,
              reminder: { groupId: g.id },
            },
          }),
          getGroupFriction(principal, g.id).catch(() => []),
        ]);
      // Pick the first behind-pace member name as the "ribbon" — keeps
      // the row line short. Skip when nobody is behind.
      const ribbon =
        friction.length > 0 ? `${friction[0].displayName} 老忘` : null;
      return {
        g,
        memberCount,
        todayDoneCount,
        totalToday,
        unreadPokes,
        ribbon,
      };
    }),
  );

  const totalMembers = decorated.reduce((acc, d) => acc + d.memberCount, 0);
  void totalMembers;

  const cards: HfGroupCard[] = decorated.map(
    ({ g, memberCount, todayDoneCount, unreadPokes, ribbon }, i) => ({
      id: g.id,
      name: g.name,
      coverEmoji: g.coverEmoji ?? null,
      tint: TINTS[i % TINTS.length],
      count: memberCount,
      today: todayDoneCount,
      ribbon,
      poke: unreadPokes,
    }),
  );

  const meta = `${groups.length} 个群 · ${totalMembers} 个朋友`;

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={1}>
      <HfGroups
        meta={meta}
        groups={cards}
        emptyFallback={
          <p
            data-testid="groups-empty"
            className="h-body"
            style={{ color: "var(--ink-mute)", padding: "24px 0" }}
          >
            还没加入任何群 — 上面建一个，或者用邀请链接加入朋友的。
          </p>
        }
      />
    </PageShell>
  );
}
