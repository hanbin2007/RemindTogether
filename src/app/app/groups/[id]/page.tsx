import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import {
  getGroup,
  getGroupLeaderboard,
  getGroupHistory,
} from "@/services/groups";
import { listReminders } from "@/services/reminders";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { PageShell } from "@/components/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import {
  HfGroupDetail,
  type HfGroupDetailProps,
} from "@/components/hf/screens/HfGroupDetail";
import type { HfTodayItem } from "@/components/hf/screens/HfToday";
import { GroupReminderForm } from "./group-reminder-form";
import { NewReminderTrigger } from "../../(home)/new-reminder-trigger";
import { listMyGroups } from "@/services/groups";

export const dynamic = "force-dynamic";

function timeOfDay(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

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
  const requestedTab = sp.tab ?? "list";
  const activeTab: HfGroupDetailProps["activeTab"] =
    requestedTab === "leaderboard" ||
    requestedTab === "history" ||
    requestedTab === "settings"
      ? requestedTab
      : "list";

  let detail;
  try {
    detail = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  const [
    reminders,
    leaderboard,
    members,
    totalToday,
    doneToday,
    history,
    myGroups,
  ] = await Promise.all([
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
    getGroupHistory(principal, id, { weeks: 8 }).catch(() => []),
    listMyGroups(principal),
  ]);

  const isOwner = detail.ownerId === session.user.id;

  const daysSinceCreated =
    Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(detail.createdAt).getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    ) + 1;

  // Project ReminderWithRelations → HfTodayItem so HfGroupDetail can use
  // the shared design <RemRow> shape.
  const reminderItems: HfTodayItem[] = reminders.map((r) => {
    const subBits: string[] = [];
    if (r.dueAt) subBits.push(timeOfDay(new Date(r.dueAt)));
    subBits.push(`#${detail.name}`);
    let chipKind: HfTodayItem["chipKind"] = null;
    let chipLabel: string | undefined;
    if (r._count.pokes > 0) {
      chipKind = "poke";
      chipLabel = `${r._count.pokes}× 拍`;
    } else if (r._count.claims > 0) {
      chipKind = "claim";
      chipLabel = `${r._count.claims} 人接`;
    }
    return {
      id: r.id,
      title: r.title,
      sub: subBits.join(" · "),
      done: r.status === "DONE",
      chipKind,
      chipLabel,
    };
  });

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={1}>
      <HfGroupDetail
        group={{
          id: detail.id,
          name: detail.name,
          coverEmoji: detail.coverEmoji,
          memberCount: detail.memberCount,
          daysSinceCreated,
        }}
        members={members.map((m) => ({
          userId: m.user.id,
          displayName: m.user.displayName,
          slot: avatarSlot(m.user.id),
        }))}
        reminders={reminderItems}
        leaderboard={leaderboard.map((e) => ({
          userId: e.userId,
          displayName: e.displayName,
          doneCount: e.doneCount,
          slot: avatarSlot(e.userId),
        }))}
        progressDoneToday={doneToday}
        progressTotalToday={totalToday}
        activeTab={activeTab}
        isOwner={isOwner}
        history={history}
        topSlot={
          activeTab === "list" ? <GroupReminderForm groupId={detail.id} /> : null
        }
        addReminderTrigger={
          <NewReminderTrigger
            groups={myGroups.map((g) => ({
              id: g.id,
              name: g.name,
              coverEmoji: g.coverEmoji ?? null,
            }))}
            initialGroupId={detail.id}
            testid="group-add-cta"
            label="加给大家的事"
            variant="wide"
          />
        }
      />
    </PageShell>
  );
}
