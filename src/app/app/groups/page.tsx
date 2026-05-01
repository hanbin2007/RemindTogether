import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { listMyGroups } from "@/services/groups";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

const TINTS = [
  "var(--rt-av-0)",
  "var(--rt-av-1)",
  "var(--rt-av-2)",
  "var(--rt-av-3)",
  "var(--rt-av-4)",
  "var(--rt-av-5)",
  "var(--rt-av-6)",
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
  // count attached to a reminder in that group.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const decorated = await Promise.all(
    groups.map(async (g) => {
      const [memberCount, todayDoneCount, totalToday, unreadPokes] =
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
        ]);
      return { g, memberCount, todayDoneCount, totalToday, unreadPokes };
    }),
  );

  const totalMembers = decorated.reduce((acc, d) => acc + d.memberCount, 0);

  return (
    <AppShell
      meta={`${groups.length} 个群 · ${totalMembers} 个朋友`}
      greeting="群组"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
      trailing={
        <Link
          href="/app/groups/new"
          className="rt-btn rt-btn-primary"
          style={{ padding: "6px 10px", fontSize: 13 }}
          data-testid="groups-new"
        >
          <Icon name="plus" size={12} /> 建群
        </Link>
      }
    >
      <div className="flex flex-col gap-2.5" data-testid="groups-list">
        {decorated.map(({ g, memberCount, todayDoneCount, totalToday, unreadPokes }, i) => (
          <Link
            key={g.id}
            href={`/app/groups/${g.id}`}
            data-testid={`groups-row-${g.id}`}
            className="rt-box rt-rise p-3 flex gap-3 items-center"
            style={{ ["--rt-rise-delay" as never]: `${Math.min(i * 50, 250)}ms` }}
          >
            <div
              className="flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                width: 46,
                height: 46,
                border: "1.5px solid var(--rt-ink)",
                borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px",
                background: TINTS[i % TINTS.length],
                transform: i % 2 === 0 ? "rotate(2deg)" : "rotate(-2deg)",
              }}
            >
              {g.coverEmoji ?? "📌"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="rt-h-h3 truncate">{g.name}</h3>
                {unreadPokes > 0 && (
                  <span
                    className="rt-chip rt-chip-poke flex-shrink-0"
                    style={{ fontSize: 11, padding: "1px 7px" }}
                  >
                    {unreadPokes}
                  </span>
                )}
              </div>
              <p
                className="rt-h-body truncate"
                style={{ fontSize: 13, marginTop: 2 }}
              >
                {memberCount} 人 · 今日 {todayDoneCount}/{totalToday}
              </p>
            </div>
            <span className="rt-h-meta">›</span>
          </Link>
        ))}

        {groups.length === 0 && (
          <p
            data-testid="groups-empty"
            className="rt-h-body text-rt-ink-mute py-6"
          >
            还没加入任何群 — 上面建一个，或者用邀请链接加入朋友的。
          </p>
        )}

        <Link
          href="/app/groups/new"
          data-testid="groups-invite-tile"
          className="rt-box rt-box-dashed p-3.5 flex items-center gap-2.5 mt-2"
          style={{ background: "var(--rt-paper-2)" }}
        >
          <span className="inline-flex flex-shrink-0">
            <Icon name="signpost" size={22} />
          </span>
          <div className="flex-1">
            <p className="rt-h-h3">叫人加进来</p>
            <p className="rt-h-body" style={{ fontSize: 13 }}>
              新建一个群，分享链接给朋友
            </p>
          </div>
          <span className="rt-arrow" />
        </Link>
      </div>
    </AppShell>
  );
}
