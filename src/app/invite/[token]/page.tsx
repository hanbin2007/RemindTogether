import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { previewInvite } from "@/services/auth/invites";
import { AuthShell } from "@/components/sketch/auth-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { avatarSlot } from "@/components/sketch/avatar";
import {
  HfL2GroupInvite,
  type HfL2GroupInviteMember,
  type HfL2GroupInviteWeeklyReminder,
} from "@/components/hf/screens/HfL2GroupInvite";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";

const HERO_MEMBERS = 5;
const WEEKLY_TOP = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await previewInvite(token);

  // Token does not resolve at all → keep the lightweight error shell
  // so the user gets a clear "this link is dead" without the full hero.
  if (!preview) {
    return (
      <AuthShell eyebrow="LINK GONE" title="这个邀请不存在">
        <SketchNotice tone="warn" testid="invite-invalid">
          可能链接打错了，或者群已经解散。
        </SketchNotice>
      </AuthShell>
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Enrich the landing with the data the design needs: hero members,
  // group age in days, and the top reminders by completion this week.
  // Best-effort — failures fall back to empty arrays so we still render.
  const groupId = preview.groupId;
  const [group, memberRows, weeklyAgg] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { createdAt: true },
    }),
    prisma.groupMember.findMany({
      where: { groupId, leftAt: null },
      orderBy: { joinedAt: "asc" },
      take: HERO_MEMBERS,
      include: { user: { select: { id: true, displayName: true } } },
    }),
    prisma.completion.groupBy({
      by: ["reminderId"],
      where: {
        completedAt: { gte: new Date(Date.now() - ONE_WEEK_MS) },
        reminder: { groupId, deletedAt: null },
      },
      _count: { _all: true },
      orderBy: { _count: { reminderId: "desc" } },
      take: WEEKLY_TOP,
    }),
  ]);

  const totalMembers = await prisma.groupMember.count({
    where: { groupId, leftAt: null },
  });

  const daysActive = group
    ? Math.max(
        1,
        Math.floor((Date.now() - group.createdAt.getTime()) / ONE_DAY_MS),
      )
    : 0;

  const members: HfL2GroupInviteMember[] = memberRows.map((m) => ({
    name: m.user.displayName,
    slot: avatarSlot(m.user.id),
  }));

  const weeklyReminderIds = weeklyAgg.map((w) => w.reminderId);
  const weeklyReminderRows =
    weeklyReminderIds.length > 0
      ? await prisma.reminder.findMany({
          where: { id: { in: weeklyReminderIds } },
          select: { id: true, title: true },
        })
      : [];
  const weeklyTitleById = new Map(
    weeklyReminderRows.map((r) => [r.id, r.title]),
  );
  const userDoneSet =
    userId && weeklyReminderIds.length > 0
      ? new Set(
          (
            await prisma.completion.findMany({
              where: {
                userId,
                reminderId: { in: weeklyReminderIds },
                completedAt: { gte: new Date(Date.now() - ONE_WEEK_MS) },
              },
              select: { reminderId: true },
            })
          ).map((c) => c.reminderId),
        )
      : new Set<string>();

  const weeklyReminders: HfL2GroupInviteWeeklyReminder[] = weeklyAgg
    .map((agg) => {
      const title = weeklyTitleById.get(agg.reminderId);
      if (!title) return null;
      return {
        title,
        doersCount: agg._count._all,
        done: userDoneSet.has(agg.reminderId),
      };
    })
    .filter((x): x is HfL2GroupInviteWeeklyReminder => x !== null);

  // Stale token: still show the landing, but swap the join CTA for an
  // explanation. This way the recipient still sees the group context
  // (helpful for re-issuing).
  if (preview.status !== "valid") {
    const title = preview.status === "expired" ? "邀请已过期" : "邀请已使用";
    return (
      <HfL2GroupInvite
        inviterDisplayName={preview.inviterDisplayName}
        groupName={preview.groupName}
        memberCount={totalMembers}
        daysActive={daysActive}
        members={members}
        weeklyReminders={weeklyReminders}
        notice={
          <SketchNotice tone="warn" testid="invite-stale" animate>
            {title} — 请让 {preview.inviterDisplayName} 重发一份邀请。
          </SketchNotice>
        }
        actions={
          <Link
            href="/app"
            className="hf-btn ghost"
            data-testid="invite-stale-back"
            style={{ flex: 1, padding: "10px 0", textAlign: "center" }}
          >
            再看看
          </Link>
        }
      />
    );
  }

  // Anonymous viewer: show the design-correct landing, but mount signup
  // and login Links instead of a JoinForm. Both routes carry the invite
  // token so we land back here after auth.
  if (!session?.user) {
    return (
      <HfL2GroupInvite
        inviterDisplayName={preview.inviterDisplayName}
        groupName={preview.groupName}
        memberCount={totalMembers}
        daysActive={daysActive}
        members={members}
        weeklyReminders={weeklyReminders}
        actions={
          <>
            <Link
              href={`/auth/login?redirectTo=${encodeURIComponent(
                `/invite/${token}`,
              )}`}
              className="hf-btn ghost"
              data-testid="invite-login-link"
              style={{ flex: 1, padding: "10px 0", textAlign: "center" }}
            >
              再看看
            </Link>
            <Link
              href={`/auth/signup?invite=${encodeURIComponent(token)}`}
              className="hf-btn primary"
              data-testid="invite-signup-link"
              style={{ flex: 2, padding: "10px 0", textAlign: "center" }}
            >
              加入小群
            </Link>
          </>
        }
      />
    );
  }

  // Logged-in: real JoinForm. The form spans the whole action row to
  // keep the design's layout, and we still render a "再看看" back link
  // alongside it.
  return (
    <HfL2GroupInvite
      inviterDisplayName={preview.inviterDisplayName}
      groupName={preview.groupName}
      memberCount={totalMembers}
      daysActive={daysActive}
      members={members}
      weeklyReminders={weeklyReminders}
      actions={
        <>
          <Link
            href="/app"
            className="hf-btn ghost"
            data-testid="invite-back-link"
            style={{ flex: 1, padding: "10px 0", textAlign: "center" }}
          >
            再看看
          </Link>
          <div style={{ flex: 2 }}>
            <JoinForm token={token} />
          </div>
        </>
      }
    />
  );
}
