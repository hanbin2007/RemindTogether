import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import {
  getGroup,
  getGroupLeaderboard,
} from "@/services/groups";
import { listReminders } from "@/services/reminders";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, AvatarStack, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";
import { TodayList } from "../../(home)/today-list";
import { GroupTabs } from "./group-tabs";
import { Leaderboard } from "./leaderboard";
import { GroupReminderForm } from "./group-reminder-form";
import { GroupActionBar } from "./group-action-bar";

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

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const { id } = await params;
  const sp = await searchParams;
  const tab = (sp.tab ?? "list") as "list" | "leaderboard" | "history" | "settings";

  let detail;
  try {
    detail = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  const [reminders, leaderboard, members, totalToday, doneToday] = await Promise.all([
    listReminders(principal, `group:${id}`),
    getGroupLeaderboard(principal, id),
    prisma.groupMember.findMany({
      where: { groupId: id, leftAt: null },
      include: { user: { select: { id: true, displayName: true } } },
      take: 20,
      orderBy: { joinedAt: "asc" },
    }),
    prisma.reminder.count({
      where: { groupId: id, isDeleted: false },
    }),
    prisma.completion.count({
      where: {
        reminder: { groupId: id },
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const isOwner = detail.ownerId === session.user.id;
  const tintIndex = avatarSlot(detail.id);

  return (
    <AppShell
      meta={`${detail.memberCount} 人${isOwner ? " · 你是群主" : ""}`}
      greeting={
        <span className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center text-3xl flex-shrink-0"
            style={{
              width: 56,
              height: 56,
              border: "1.6px solid var(--rt-ink)",
              borderRadius: "16px 8px 14px 6px / 6px 14px 8px 16px",
              background: TINTS[tintIndex],
              transform: "rotate(-3deg)",
            }}
          >
            {detail.coverEmoji ?? "📌"}
          </span>
          <span className="truncate">{detail.name}</span>
        </span>
      }
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
    >
      <Link
        href="/app/groups"
        className="rt-h-meta inline-flex items-center gap-1 mb-3"
      >
        ‹ 群组列表
      </Link>

      <div className="flex items-center gap-2 mb-3">
        <AvatarStack
          people={members.slice(0, 5).map((m) => ({
            name: m.user.displayName,
            i: avatarSlot(m.user.id),
          }))}
          max={5}
          size={26}
        />
        {detail.memberCount > 5 && (
          <span className="rt-h-meta">+{detail.memberCount - 5}</span>
        )}
        <Link
          href={`/app/groups/${detail.id}/invite`}
          data-testid="group-invite-link"
          className="rt-btn rt-btn-ghost ml-auto"
          style={{ padding: "4px 10px", fontSize: 13 }}
        >
          <Icon name="plus" size={12} /> 邀请
        </Link>
      </div>

      <GroupTabs groupId={detail.id} active={tab} />

      <div className="mt-3 mb-24">
        {tab === "list" && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="rt-h-meta">今天</span>
              <span className="rt-h-meta ml-auto">
                {doneToday}/{totalToday} 完成
              </span>
            </div>
            <div className="rt-bar mt-1.5 mb-3">
              <i style={{ width: `${totalToday > 0 ? (doneToday / totalToday) * 100 : 0}%` }} />
            </div>
            <div className="rt-box px-3">
              <TodayList
                reminders={reminders.map((r) => ({
                  id: r.id,
                  title: r.title,
                  description: r.description,
                  status: r.status,
                  visibility: r.visibility,
                  group: r.group ? { id: r.group.id, name: r.group.name } : null,
                  dueAt: r.dueAt?.toISOString() ?? null,
                }))}
                compact
                emptyHint=""
              />
              {reminders.length === 0 && (
                <p className="rt-h-body py-3 text-rt-ink-mute">
                  还没有群提醒，加一个让大家一起看到。
                </p>
              )}
            </div>

            <div className="mt-4">
              <GroupReminderForm groupId={detail.id} />
            </div>

            <Leaderboard
              entries={leaderboard.slice(0, 3).map((e) => ({
                userId: e.userId,
                displayName: e.displayName,
                doneCount: e.doneCount,
              }))}
              compact
            />
          </>
        )}

        {tab === "leaderboard" && (
          <Leaderboard
            entries={leaderboard.map((e) => ({
              userId: e.userId,
              displayName: e.displayName,
              doneCount: e.doneCount,
            }))}
          />
        )}

        {tab === "history" && (
          <p className="rt-h-body py-6 text-rt-ink-mute">
            历史回顾正在开发中 — 完成过的提醒会按周归档到这里。
          </p>
        )}

        {tab === "settings" && (
          <div className="space-y-3">
            <div className="rt-box p-3">
              <p className="rt-h-h3">群设置</p>
              <p className="rt-h-body mt-1">
                {isOwner
                  ? "你可以重命名、解散群、转让群主。"
                  : "退群后随时可以再加回来。"}
              </p>
            </div>
            {isOwner ? (
              <Link
                href={`/app/groups/${detail.id}/disband`}
                data-testid="group-disband"
                className="rt-btn rt-btn-ghost"
                style={{ color: "var(--rt-poke)" }}
              >
                解散这个群
              </Link>
            ) : (
              <form action={`/api/groups/${detail.id}/leave`} method="post">
                <button
                  type="submit"
                  data-testid="group-leave"
                  className="rt-btn rt-btn-ghost"
                  style={{ color: "var(--rt-poke)" }}
                >
                  退出群
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <GroupActionBar groupId={detail.id} />
    </AppShell>
  );
}

// Trailing avatar (assigned via server-side preview where used).
void Avatar;
