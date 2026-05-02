/**
 * Server-side data fetch + thin wrapper around `<HfReminderDetail />`.
 * The visual port lives in `components/hf/screens/HfReminderDetail.tsx`;
 * this page shapes data and plugs the client-component slot props.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getReminder } from "@/services/reminders";
import { getStreakStatus } from "@/services/streaks";
import { previewSkipDay } from "@/services/skip-day";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { avatarSlot } from "@/components/sketch/avatar";
import {
  HfReminderDetail,
  type HfReminderDetailComment,
  type HfReminderStripCell,
} from "@/components/hf/screens/HfReminderDetail";
import { CommentForm } from "./comment-form";
import { ReactionBar } from "./reaction-bar";
import { ReminderActionBar } from "./action-bar";
import { ReportButton } from "./report-button";
import { AttachmentList } from "./attachment-list";
import { AttachmentUpload } from "./attachment-upload";

export const dynamic = "force-dynamic";

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function ReminderDetailPage({
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
  let reminder;
  try {
    reminder = await getReminder(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    commentRows,
    reactions,
    groupMembers,
    streak,
    last14,
    shieldPreview,
    doneTodayCount,
    todayWinTitles,
    pokeCountForAssignee,
    attachments,
  ] = await Promise.all([
    prisma.comment.findMany({
      where: { reminderId: id, isDeleted: false },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, displayName: true } } },
      take: 100,
    }),
    prisma.reaction.findMany({
      where: { reminderId: id },
      select: { emoji: true, userId: true },
    }),
    reminder.groupId
      ? prisma.groupMember.findMany({
          where: { groupId: reminder.groupId, leftAt: null },
          include: { user: { select: { id: true, displayName: true } } },
          take: 50,
        })
      : Promise.resolve([]),
    getStreakStatus(principal),
    prisma.streakDay.findMany({
      where: { userId: principal.id },
      orderBy: { date: "desc" },
      take: 14,
    }),
    previewSkipDay(principal),
    prisma.completion.count({
      where: {
        userId: principal.id,
        completedAt: { gte: todayStart },
      },
    }),
    prisma.completion.findMany({
      where: {
        userId: principal.id,
        completedAt: { gte: todayStart },
      },
      include: { reminder: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 3,
    }),
    // "X 人想到 ta" — count distinct posters who poked the assignee
    // (or the reminder creator if no assignee) about THIS reminder.
    reminder.assigneeId ||
    (reminder.visibility === "PRIVATE" ? null : reminder.creatorId)
      ? prisma.poke
          .findMany({
            where: {
              toId: reminder.assigneeId ?? reminder.creatorId,
              reminderId: id,
              readAt: null,
            },
            distinct: ["fromId"],
            select: { fromId: true },
          })
          .then((rows) => rows.length)
      : Promise.resolve(0),
    prisma.attachment.findMany({
      where: { reminderId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true, mimeType: true },
    }),
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }

  const myClaim = reminder.claims.find((c) => c.userId === session.user!.id);
  const otherClaims = reminder.claims
    .filter((c) => c.userId !== session.user!.id)
    .map((c) => ({ userId: c.userId, displayName: c.user.displayName }));

  const pokeCandidates =
    reminder.visibility === "GROUP"
      ? groupMembers
          .filter((m) => m.userId !== session.user!.id)
          .map((m) => ({ id: m.userId, displayName: m.user.displayName }))
      : reminder.creatorId !== session.user.id
        ? [
            {
              id: reminder.creatorId,
              displayName: reminder.creator.displayName,
            },
          ]
        : [];

  const isCreator = reminder.creatorId === session.user.id;
  const backHref = reminder.groupId
    ? `/app/groups/${reminder.groupId}`
    : "/app/private";

  // Reverse last14 to chronological for the strip; build 13 cells.
  const days = [...last14].reverse();
  const stripCells: HfReminderStripCell[] = Array.from({ length: 13 }).map(
    (_, i) => {
      const d = days[i];
      if (!d) return "l1";
      if (d.status === "DONE") return "l3";
      if (d.status === "PROTECTED") return "shield";
      if (d.status === "SKIPPED") return "skip";
      return "x";
    },
  );

  const primaryAssigneeUser = reminder.assignee
    ? reminder.assignee
    : reminder.claims.find((c) => c.userId !== session.user!.id)?.user;
  const primaryAssigneeId =
    reminder.assignee?.id ??
    reminder.claims.find((c) => c.userId !== session.user!.id)?.userId;

  const assignee =
    primaryAssigneeUser && primaryAssigneeId
      ? {
          id: primaryAssigneeId,
          displayName: primaryAssigneeUser.displayName,
          slot: avatarSlot(primaryAssigneeId),
          hint: "本周还在适应节奏",
        }
      : null;

  const comments: HfReminderDetailComment[] = commentRows.map((c) => ({
    id: c.id,
    name: c.user.displayName,
    userId: c.userId,
    slot: avatarSlot(c.userId),
    time: formatTime(c.createdAt),
    text: c.content,
    trailingSlot:
      c.userId !== session.user!.id ? (
        <ReportButton
          contentType="COMMENT"
          contentId={c.id}
          variant="chip"
          testIdSuffix={`comment-${c.id}`}
        />
      ) : undefined,
  }));

  return (
    <HfReminderDetail
      reminderId={reminder.id}
      title={reminder.title}
      description={reminder.description}
      groupName={reminder.group?.name ?? null}
      backHref={backHref}
      creator={{
        displayName: reminder.creator.displayName,
        slot: avatarSlot(reminder.creator.id),
      }}
      dueText={
        reminder.dueAt ? `截止 ${formatTime(new Date(reminder.dueAt))}` : null
      }
      visibility={reminder.visibility}
      assignee={assignee}
      pokeCountForAssignee={pokeCountForAssignee}
      otherClaims={otherClaims}
      doneTodayCount={doneTodayCount}
      todayWins={todayWinTitles.map((c) => ({
        id: c.id,
        title: c.reminder.title,
      }))}
      streakCurrent={streak.current}
      shieldCards={streak.shieldCards}
      stripCells={stripCells}
      pokeTarget={pokeCandidates[0] ?? null}
      comments={comments}
      reactionBarSlot={
        <ReactionBar reminderId={reminder.id} counts={reactionCounts} />
      }
      commentFormSlot={<CommentForm reminderId={reminder.id} />}
      actionBarSlot={
        <ReminderActionBar
          reminderId={reminder.id}
          reminderTitle={reminder.title}
          status={reminder.status}
          canClaim={reminder.visibility === "GROUP" && !isCreator}
          myClaim={Boolean(myClaim)}
          dueAt={reminder.dueAt?.toISOString() ?? null}
          shield={shieldPreview}
        />
      }
      reportSlot={
        !isCreator ? (
          <ReportButton
            contentType="REMINDER"
            contentId={reminder.id}
            testIdSuffix={`reminder-${reminder.id}`}
          />
        ) : undefined
      }
      attachmentsSlot={<AttachmentList items={attachments} />}
      attachmentUploadSlot={
        isCreator ? <AttachmentUpload reminderId={reminder.id} /> : undefined
      }
    />
  );
}
