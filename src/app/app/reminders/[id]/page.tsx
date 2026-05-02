import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getReminder } from "@/services/reminders";
import { getStreakStatus } from "@/services/streaks";
import { previewSkipDay } from "@/services/skip-day";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";
import { CommentForm } from "./comment-form";
import { ReactionBar } from "./reaction-bar";
import { PokeComposer } from "./poke-composer";
import { ReminderActionBar } from "./action-bar";

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

  const [comments, reactions, groupMembers, streak, last14, shieldPreview] =
    await Promise.all([
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
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }

  const myClaim = reminder.claims.find((c) => c.userId === session.user!.id);

  const otherClaims = reminder.claims.filter(
    (c) => c.userId !== session.user!.id,
  );

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
  const dueText = reminder.dueAt
    ? `截止 ${formatTime(new Date(reminder.dueAt))}`
    : null;

  // Reverse last14 to chronological for the strip
  const days = last14.reverse();

  return (
    <AppShell
      meta={null}
      greeting={undefined}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="other"
    >
      <div className="flex items-center mb-2">
        <Link
          href={backHref}
          data-testid="reminder-back"
          className="rt-btn rt-btn-ghost"
          style={{ padding: "4px 8px", fontSize: 14 }}
        >
          ‹
        </Link>
        {reminder.group && (
          <span className="rt-chip rt-chip-dim ml-auto">
            #{reminder.group.name}
          </span>
        )}
      </div>

      <div className="px-1 mb-2">
        <h1
          data-testid="reminder-title"
          className="rt-h-display"
          style={{ fontSize: 26 }}
        >
          {reminder.title}
        </h1>
        <div className="rt-h-body flex items-center gap-1.5 mt-1">
          <Avatar
            name={reminder.creator.displayName}
            i={avatarSlot(reminder.creator.id)}
            size={20}
          />
          <span>
            {reminder.creator.displayName} 创建
            {reminder.dueAt && ` · ${formatTime(new Date(reminder.dueAt))}`}
            {dueText && ` · ${dueText}`}
          </span>
        </div>
      </div>

      {reminder.description && (
        <p
          data-testid="reminder-description"
          className="rt-h-body mt-3 mb-3 whitespace-pre-wrap"
        >
          {reminder.description}
        </p>
      )}

      {/* assigned + claims */}
      {reminder.visibility === "GROUP" && (
        <div className="rt-box p-3 mt-3">
          <p className="rt-h-meta">指派给</p>
          {(() => {
            // Prefer the explicit assignee (Phase 10); fall back to the
            // earliest claim so legacy reminders keep working.
            const primaryUser =
              reminder.assignee ??
              (otherClaims[0] ? otherClaims[0].user : null);
            const primaryId =
              reminder.assigneeId ??
              (otherClaims[0]?.userId ?? null);
            if (primaryUser && primaryId) {
              return (
                <div className="flex items-center gap-2.5 mt-1.5">
                  <Avatar
                    name={primaryUser.displayName}
                    i={avatarSlot(primaryId)}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="rt-h-row" style={{ fontSize: 16 }}>
                      {primaryUser.displayName}
                    </p>
                    <p className="rt-h-meta">
                      {reminder.assigneeId
                        ? "由群里指派"
                        : "本周还在适应节奏"}
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <p className="rt-h-body mt-1.5 text-rt-ink-mute">
                还没人接手 — 你可以点下面的「我帮 ta 做」。
              </p>
            );
          })()}
          {otherClaims.length > 0 && (
            <div
              className="rt-box rt-box-dashed mt-2.5 p-2 flex gap-2 items-center"
              style={{
                background: "var(--rt-claim-soft)",
                borderColor: "var(--rt-claim)",
              }}
              data-testid="claims-list"
            >
              <span className="inline-flex rt-text-claim flex-shrink-0">
                <Icon name="handshake" size={16} />
              </span>
              <p
                className="flex-1 rt-h-body"
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-kalam), Kalam, sans-serif",
                }}
              >
                <b>{otherClaims.length} 人</b> 也想搭把手：
                {otherClaims
                  .map((c) => c.user.displayName)
                  .join("、")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* reactions */}
      <div className="mt-3">
        <p className="rt-h-meta mb-1.5">REACT · 反应</p>
        <ReactionBar reminderId={reminder.id} counts={reactionCounts} />
      </div>

      {/* poke */}
      {pokeCandidates.length > 0 && (
        <div className="mt-3">
          <p className="rt-h-meta mb-1.5">POKE · 拍拍</p>
          <PokeComposer reminderId={reminder.id} candidates={pokeCandidates} />
        </div>
      )}

      {/* comments — design's "朋友的话" timeline */}
      <p className="rt-h-meta mt-3.5 mb-1">朋友的话（{comments.length}）</p>
      <div className="rt-box px-3" data-testid="comment-list">
        {comments.length === 0 ? (
          <p className="rt-h-body py-3 italic text-rt-ink-mute">
            还没人留言。
          </p>
        ) : (
          comments.map((c, i) => (
            <div
              key={c.id}
              data-testid={`comment-${c.id}`}
              className="rt-row"
              style={{
                borderBottom:
                  i === comments.length - 1 ? "none" : undefined,
              }}
            >
              <Avatar
                name={c.user.displayName}
                i={avatarSlot(c.userId)}
                size={24}
              />
              <div className="flex-1 min-w-0">
                <p className="rt-h-row" style={{ fontSize: 15 }}>
                  {c.user.displayName}
                  <span
                    className="rt-h-meta ml-2"
                    style={{ display: "inline" }}
                  >
                    {formatTime(c.createdAt)}
                  </span>
                </p>
                <p className="rt-h-body whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2">
        <CommentForm reminderId={reminder.id} />
      </div>

      {/* streak strip — "encouraging not punitive" */}
      <div className="rt-box rt-box-dim p-3 mt-4">
        <div className="flex items-center">
          <p className="rt-h-meta">
            最近 14 天 · 连胜{" "}
            <b style={{ color: "var(--rt-ink)" }}>{streak.current}</b>
          </p>
          <p className="rt-h-meta ml-auto inline-flex items-center gap-1">
            <Icon name="shield" size={11} /> 保护卡 ×{streak.shieldCards}
          </p>
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 14 }).map((_, i) => {
            const d = days[i];
            let cls = "rt-dot";
            if (!d) cls += " rt-dot-l1";
            else if (d.status === "DONE") cls += " rt-dot-l3";
            else if (d.status === "PROTECTED") cls += " rt-dot-shield";
            else if (d.status === "SKIPPED") cls += " rt-box-dashed";
            else if (d.status === "MISSED") cls += " rt-dot-x";
            return (
              <span
                key={i}
                className={cls}
                style={{ height: 22, flex: 1 }}
              />
            );
          })}
          <span
            className="rt-dot rt-box-dashed"
            style={{
              height: 22,
              flex: 1,
              background: "var(--rt-poke-soft)",
              borderColor: "var(--rt-poke)",
            }}
            aria-label="今天"
          />
        </div>
        <p className="rt-h-meta mt-1.5">
          ■ 收下 ⌧ 跳过日（不算输） ▢ 今天
        </p>
      </div>

      <ReminderActionBar
        reminderId={reminder.id}
        reminderTitle={reminder.title}
        status={reminder.status}
        canClaim={reminder.visibility === "GROUP" && !isCreator}
        myClaim={Boolean(myClaim)}
        dueAt={reminder.dueAt?.toISOString() ?? null}
        shield={shieldPreview}
      />
    </AppShell>
  );
}
