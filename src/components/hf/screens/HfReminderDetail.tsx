/**
 * 1:1 port of `window.HfReminderDetail` (design/project/hf-screens-B.jsx
 * lines 315-409) plus the `Comment` helper (lines 411-432). Pure
 * presentational; the server page in `/app/reminders/[id]/page.tsx`
 * shapes data and passes it as typed props.
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                  → responsive max-width column
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - hardcoded sample reminder data    → typed props
 *   - hardcoded comment list             → `comments` prop
 *   - hardcoded streak strip pattern     → `stripCells` prop (13-cell)
 *   - design's static reactions chips    → `reactionBarSlot` (real
 *     `<ReactionBar>` is client-side, so the page passes it in)
 *   - 留言 + 底部 action bar               → slot props
 *
 * className + inline styles + structure preserved byte-for-byte.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { HF } from "@/components/sketch/hf";

export interface HfReminderDetailComment {
  id: string;
  name: string;
  userId: string;
  /** Avatar palette slot (0..6) — pass `avatarSlot(userId)` from the page. */
  slot: number;
  /** Pre-formatted "HH:MM". */
  time: string;
  text: string;
}

export interface HfReminderDetailAssignee {
  /** User id used to derive avatar slot. */
  id: string;
  displayName: string;
  /** Avatar palette slot (0..6). */
  slot: number;
  /** Sub-line; design uses "本周还在适应节奏". */
  hint: string;
}

export interface HfReminderDetailClaimUser {
  userId: string;
  displayName: string;
}

export interface HfReminderDetailWin {
  id: string;
  title: string;
}

export interface HfReminderDetailPokeTarget {
  id: string;
  displayName: string;
}

/** 13 cells, oldest → newest. The 14th "today" cell is rendered by
 *  this component as a dashed poke-soft outline (per design). */
export type HfReminderStripCell = "l3" | "shield" | "skip" | "x" | "l1";

export interface HfReminderDetailProps {
  reminderId: string;
  title: string;
  description: string | null;
  groupName: string | null;
  backHref: string;
  creator: { displayName: string; slot: number };
  /** Pre-formatted "截止 HH:MM" or null. */
  dueText: string | null;
  visibility: "PRIVATE" | "GROUP";
  /** Assignee/owner box (only rendered for GROUP). */
  assignee: HfReminderDetailAssignee | null;
  /** "X 人想到 ta" chip count next to assignee. 0 hides the chip. */
  pokeCountForAssignee: number;
  /** Other people who've claimed (excluding the assignee). */
  otherClaims: HfReminderDetailClaimUser[];

  // 今日小赢
  doneTodayCount: number;
  todayWins: HfReminderDetailWin[];

  // streak strip
  streakCurrent: number;
  shieldCards: number;
  stripCells: HfReminderStripCell[];

  // poke launcher
  pokeTarget: HfReminderDetailPokeTarget | null;

  // comments timeline
  comments: HfReminderDetailComment[];

  // slot props — caller plugs the client-component instances
  reactionBarSlot: ReactNode;
  commentFormSlot: ReactNode;
  actionBarSlot: ReactNode;
}

interface CommentRowProps {
  id: string;
  name: string;
  userId: string;
  slot: number;
  time: string;
  text: string;
  last: boolean;
}

/**
 * Direct port of the design's `Comment` helper (lines 411-432).
 */
function CommentRow({
  id,
  name,
  slot,
  time,
  text,
  last,
}: CommentRowProps) {
  return (
    <div
      data-testid={`comment-${id}`}
      className="hf-row"
      style={{
        alignItems: "flex-start",
        borderBottom: last ? "none" : "1.3px dashed var(--ink-faint)",
      }}
    >
      <HF.Av name={name} i={slot} size={26} />
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

export function HfReminderDetail({
  reminderId,
  title,
  description,
  groupName,
  backHref,
  creator,
  dueText,
  visibility,
  assignee,
  pokeCountForAssignee,
  otherClaims,
  doneTodayCount,
  todayWins,
  streakCurrent,
  shieldCards,
  stripCells,
  pokeTarget,
  comments,
  reactionBarSlot,
  commentFormSlot,
  actionBarSlot,
}: HfReminderDetailProps) {
  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        width: "100%",
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
        {groupName && (
          <span className="hf-chip dim" style={{ marginLeft: "auto" }}>
            #{groupName}
          </span>
        )}
      </div>

      <div style={{ padding: "4px 18px 8px" }}>
        <div
          data-testid="reminder-title"
          className="h-display"
          style={{ fontSize: 26 }}
        >
          {title}
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
          <HF.Av name={creator.displayName} i={creator.slot} size={20} />
          {creator.displayName} 创建
          {dueText && ` · ${dueText}`}
        </div>
      </div>

      {description && (
        <div style={{ padding: "0 18px" }}>
          <p
            data-testid="reminder-description"
            className="h-body"
            style={{ fontSize: 14, marginTop: 6, whiteSpace: "pre-wrap" }}
          >
            {description}
          </p>
        </div>
      )}

      <div style={{ flex: 1, padding: "6px 14px 100px", overflowY: "auto" }}>
        {/* assigned + claim — only for shared (GROUP) reminders */}
        {visibility === "GROUP" && (
          <div
            className="hf-box"
            style={{ padding: 12 }}
            data-testid="assigned-box"
          >
            <div className="h-meta">指派给</div>
            {assignee ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <HF.Av
                  name={assignee.displayName}
                  i={assignee.slot}
                  size={36}
                />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 16 }}>
                    {assignee.displayName}
                  </div>
                  <div className="h-meta">{assignee.hint}</div>
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
              <div
                className="h-body"
                style={{ marginTop: 6, fontSize: 14 }}
              >
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
                  style={{
                    display: "inline-flex",
                    color: "var(--claim)",
                  }}
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
                  {otherClaims.map((c) => c.displayName).join("、")}
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
              {todayWins.map((c) => (
                <span
                  key={c.id}
                  className="hf-chip"
                  style={{
                    fontSize: 12,
                    textDecoration: "line-through",
                    opacity: 0.7,
                  }}
                >
                  {c.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* reactions — caller passes <ReactionBar /> */}
        <div style={{ marginTop: 14, marginBottom: 4 }}>
          <div className="h-meta" style={{ marginBottom: 6 }}>
            朋友的反应
          </div>
          {reactionBarSlot}
        </div>

        {/* poke launcher */}
        {pokeTarget && (
          <div style={{ marginTop: 12 }}>
            <Link
              href={`/app/reminders/${reminderId}/poke?to=${pokeTarget.id}`}
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
              <HF.Icon name="wave" size={14} /> 拍拍 {pokeTarget.displayName}
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
                name={c.name}
                userId={c.userId}
                slot={c.slot}
                time={c.time}
                text={c.text}
                last={i === comments.length - 1}
              />
            ))
          )}
        </div>

        <div style={{ marginTop: 8 }}>{commentFormSlot}</div>

        {/* streak + protection — encouraging not punitive */}
        <div className="hf-box dim" style={{ marginTop: 14, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="h-meta">
              最近 14 天 · 连胜{" "}
              <b style={{ color: "var(--ink)" }}>{streakCurrent}</b>
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
              <HF.Icon name="shield" size={11} /> 保护卡 ×{shieldCards}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {stripCells.map((cell, i) => (
              <div
                key={i}
                className={`hf-dot ${cell === "l3" ? "l3" : ""} ${cell === "x" ? "x" : ""}`}
                style={{
                  width: 16,
                  height: 22,
                  flex: 1,
                  background:
                    cell === "skip"
                      ? "var(--paper)"
                      : cell === "shield"
                        ? "var(--ok-soft)"
                        : undefined,
                  borderStyle: cell === "skip" ? "dashed" : undefined,
                  borderColor: cell === "shield" ? "var(--ok)" : undefined,
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

      {actionBarSlot}
    </div>
  );
}
