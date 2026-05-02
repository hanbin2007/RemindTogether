/**
 * Direct port of HfReminderDetail (design/project/hf-screens-B.jsx
 * lines 315-409). Mechanical replacements only:
 *   - <Phone> wrapper                  → page chrome
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - hardcoded sample reminder data    → real props from getReminder
 *   - hardcoded comment list             → real comments + reactions
 *   - hardcoded streak strip pattern     → real StreakDay rows
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getReminder } from "@/services/reminders";
import { getStreakStatus } from "@/services/streaks";
import { previewSkipDay } from "@/services/skip-day";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { HF } from "@/components/sketch/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import { CommentForm } from "./comment-form";
import { ReactionBar } from "./reaction-bar";
import { ReminderActionBar } from "./action-bar";

export const dynamic = "force-dynamic";

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface CommentRowProps {
  id: string;
  name: string;
  userId: string;
  time: string;
  text: string;
  last: boolean;
}

/**
 * Direct port of the design's `Comment` helper (lines 411-432). Inner
 * markup preserved; reactions slot kept as a render-prop so the parent
 * can plug real data without invalidating styles.
 */
function CommentRow({ id, name, userId, time, text, last }: CommentRowProps) {
  return (
    <div
      data-testid={`comment-${id}`}
      className="hf-row"
      style={{
        alignItems: "flex-start",
        borderBottom: last ? "none" : "1.3px dashed var(--ink-faint)",
      }}
    >
      <HF.Av name={name} i={avatarSlot(userId)} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <div className="h-row" style={{ fontSize: 14 }}>
            {name}
          </div>
          <div className="h-meta">{time}</div>
        </div>
        {text && (
          <div
            className="h-body"
            style={{ fontSize: 15, color: "var(--ink)", marginTop: 1 }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
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
    comments,
    reactions,
    groupMembers,
    streak,
    last14,
    shieldPreview,
    doneTodayCount,
    todayWinTitles,
    pokeCountForAssignee,
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
    reminder.assigneeId || (reminder.visibility === "PRIVATE" ? null : reminder.creatorId)
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

  // Reverse last14 to chronological for the strip
  const days = [...last14].reverse();

  // Build the streak strip pattern matching design lines 383-389:
  // for each of the 13 past days, classify as l3 (DONE/PROTECTED) or
  // skip (SKIPPED) or l1 (MISSED/missing).
  const stripCells = Array.from({ length: 13 }).map((_, i) => {
    const d = days[i];
    if (!d) return { kind: "l1" as const };
    if (d.status === "DONE") return { kind: "l3" as const };
    if (d.status === "PROTECTED") return { kind: "shield" as const };
    if (d.status === "SKIPPED") return { kind: "skip" as const };
    return { kind: "x" as const };
  });

  const primaryAssigneeUser = reminder.assignee
    ? reminder.assignee
    : otherClaims[0]?.user;
  const primaryAssigneeId = reminder.assignee?.id ?? otherClaims[0]?.userId;

  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        maxWidth: "var(--app-max-w)",
        margin: "0 auto",
        minHeight: "100vh",
        position: "relative",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          padding: "14px 14px 4px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href={backHref}
          data-testid="reminder-back"
          className="hf-btn ghost"
          style={{ padding: "4px 8px", fontSize: 14 }}
        >
          ‹
        </Link>
        {reminder.group && (
          <span className="hf-chip dim" style={{ marginLeft: "auto" }}>
            #{reminder.group.name}
          </span>
        )}
      </div>

      <div style={{ padding: "4px 18px 8px" }}>
        <div
          data-testid="reminder-title"
          className="h-display"
          style={{ fontSize: 26 }}
        >
          {reminder.title}
        </div>
        <div
          className="h-body"
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <HF.Av
            name={reminder.creator.displayName}
            i={avatarSlot(reminder.creator.id)}
            size={20}
          />
          {reminder.creator.displayName} 创建
          {reminder.dueAt &&
            ` · 截止 ${formatTime(new Date(reminder.dueAt))}`}
        </div>
      </div>

      {reminder.description && (
        <div style={{ padding: "0 18px" }}>
          <p
            data-testid="reminder-description"
            className="h-body"
            style={{ fontSize: 14, marginTop: 6, whiteSpace: "pre-wrap" }}
          >
            {reminder.description}
          </p>
        </div>
      )}

      <div
        style={{ flex: 1, padding: "6px 14px 100px", overflowY: "auto" }}
      >
        {/* assigned + claim */}
        {reminder.visibility === "GROUP" && (
          <div className="hf-box" style={{ padding: 12 }} data-testid="assigned-box">
            <div className="h-meta">指派给</div>
            {primaryAssigneeUser && primaryAssigneeId ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <HF.Av
                  name={primaryAssigneeUser.displayName}
                  i={avatarSlot(primaryAssigneeId)}
                  size={36}
                />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 16 }}>
                    {primaryAssigneeUser.displayName}
                  </div>
                  <div className="h-meta">本周还在适应节奏</div>
                </div>
                {pokeCountForAssignee > 0 && (
                  <span
                    className="hf-chip"
                    style={{
                      background: "var(--poke-soft)",
                      color: "var(--poke)",
                      borderColor: "var(--poke)",
                    }}
                    data-testid="assigned-poke-chip"
                  >
                    {pokeCountForAssignee} 人想到 ta
                  </span>
                )}
              </div>
            ) : (
              <div className="h-body" style={{ marginTop: 6, fontSize: 14 }}>
                还没人接手 — 点下面「我帮 ta 做」。
              </div>
            )}
            {otherClaims.length > 0 && (
              <div
                className="hf-box dashed"
                style={{
                  marginTop: 10,
                  padding: 8,
                  background: "var(--claim-soft)",
                  borderColor: "var(--claim)",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
                data-testid="claims-list"
              >
                <span
                  style={{ display: "inline-flex", color: "var(--claim)" }}
                >
                  <HF.Icon name="handshake" size={16} />
                </span>
                <div
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: "var(--hand-2)",
                  }}
                >
                  <b>{otherClaims.length} 人</b> 也想搭把手：
                  {otherClaims.map((c) => c.user.displayName).join("、")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 今日小赢 — celebrate completed wins */}
        {doneTodayCount > 0 && (
          <div
            className="hf-box thick tilt-r"
            style={{
              marginTop: 14,
              padding: 12,
              background: "var(--ok-soft)",
              borderColor: "var(--ok)",
            }}
            data-testid="today-wins"
          >
            <div
              className="h-meta"
              style={{
                color: "var(--ok)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <HF.Icon name="check" size={12} /> 今日小赢
            </div>
            <div
              className="h-row"
              style={{
                fontSize: 16,
                marginTop: 4,
                fontFamily: "var(--hand-2)",
              }}
            >
              你今天已经搞定 <b>{doneTodayCount} 件</b> 啦 🎉
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {todayWinTitles.map((c) => (
                <span
                  key={c.id}
                  className="hf-chip"
                  style={{
                    fontSize: 12,
                    textDecoration: "line-through",
                    opacity: 0.7,
                  }}
                >
                  {c.reminder.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* reactions */}
        <div style={{ marginTop: 14, marginBottom: 4 }}>
          <div className="h-meta" style={{ marginBottom: 6 }}>
            朋友的反应
          </div>
          <ReactionBar reminderId={reminder.id} counts={reactionCounts} />
        </div>

        {/* poke launcher */}
        {pokeCandidates.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Link
              href={`/app/reminders/${reminder.id}/poke?to=${pokeCandidates[0].id}`}
              data-testid="poke-open"
              className="hf-btn poke"
              style={{
                padding: "8px 14px",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <HF.Icon name="wave" size={14} /> 拍拍{" "}
              {pokeCandidates[0].displayName}
            </Link>
          </div>
        )}

        {/* timeline */}
        <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>
          朋友的话（{comments.length}）
        </div>
        <div
          className="hf-box"
          style={{ padding: "4px 12px" }}
          data-testid="comment-list"
        >
          {comments.length === 0 ? (
            <div
              className="h-body"
              style={{
                padding: "8px 0",
                fontStyle: "italic",
                color: "var(--ink-mute)",
              }}
            >
              还没人留言。
            </div>
          ) : (
            comments.map((c, i) => (
              <CommentRow
                key={c.id}
                id={c.id}
                name={c.user.displayName}
                userId={c.userId}
                time={formatTime(c.createdAt)}
                text={c.content}
                last={i === comments.length - 1}
              />
            ))
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <CommentForm reminderId={reminder.id} />
        </div>

        {/* streak + protection — encouraging not punitive */}
        <div className="hf-box dim" style={{ marginTop: 14, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="h-meta">
              最近 14 天 · 连胜{" "}
              <b style={{ color: "var(--ink)" }}>{streak.current}</b>
            </div>
            <div
              className="h-meta"
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <HF.Icon name="shield" size={11} /> 保护卡 ×{streak.shieldCards}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {stripCells.map((cell, i) => (
              <div
                key={i}
                className={`hf-dot ${cell.kind === "l3" ? "l3" : ""} ${cell.kind === "x" ? "x" : ""}`}
                style={{
                  width: 16,
                  height: 22,
                  flex: 1,
                  background:
                    cell.kind === "skip"
                      ? "var(--paper)"
                      : cell.kind === "shield"
                        ? "var(--ok-soft)"
                        : undefined,
                  borderStyle: cell.kind === "skip" ? "dashed" : undefined,
                  borderColor:
                    cell.kind === "shield" ? "var(--ok)" : undefined,
                }}
              />
            ))}
            <div
              className="hf-dot"
              style={{
                width: 16,
                height: 22,
                flex: 1,
                borderStyle: "dashed",
                background: "var(--poke-soft)",
                borderColor: "var(--poke)",
              }}
              aria-label="今天"
            />
          </div>
          <div className="h-meta" style={{ marginTop: 6 }}>
            ■ 收下 ⌧ 跳过日（不算输） ▢ 今天
          </div>
        </div>
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
    </div>
  );
}
