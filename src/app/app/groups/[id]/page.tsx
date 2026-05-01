import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  getGroup,
  getGroupLeaderboard,
} from "@/services/groups";
import { listReminders } from "@/services/reminders";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { AppShell } from "@/components/sketch/app-shell";
import { TodayList } from "../../(home)/today-list";
import { Leaderboard } from "./leaderboard";
import { InviteButton } from "./invite-button";
import { GroupReminderForm } from "./group-reminder-form";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  // Use the service layer; converts NotFound/Forbidden into 404 here so
  // we don't leak existence to non-members.
  let detail;
  try {
    detail = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  const [reminders, leaderboard] = await Promise.all([
    listReminders(principal, `group:${id}`),
    getGroupLeaderboard(principal, id),
  ]);

  return (
    <AppShell
      greeting={`${detail.coverEmoji ?? "📌"} ${detail.name}`}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
    >
      <Link
        href="/app/groups"
        className="rt-squig text-rt-ink-soft text-sm mb-4 inline-block"
      >
        ← 群组列表
      </Link>

      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-4">
        {detail.memberCount} 位成员
        {detail.ownerId === session.user.id ? " · 你是群主" : ""}
      </p>

      <div className="mb-6">
        <Leaderboard
          entries={leaderboard.map((e) => ({
            userId: e.userId,
            displayName: e.displayName,
            doneCount: e.doneCount,
          }))}
        />
      </div>

      <div className="mb-4">
        <InviteButton groupId={detail.id} />
      </div>

      <h2 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-2xl mt-6">
        群提醒
      </h2>
      <div className="mt-3 mb-4">
        <GroupReminderForm groupId={detail.id} />
      </div>
      <TodayList
        reminders={reminders.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          visibility: r.visibility,
          group: r.group ? { id: r.group.id, name: r.group.name } : null,
        }))}
        emptyHint="还没有群提醒，加一个让大家一起看到。"
      />
    </AppShell>
  );
}
