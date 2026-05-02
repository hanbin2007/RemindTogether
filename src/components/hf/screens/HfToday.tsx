/**
 * 1:1 port of `window.HfToday` from
 * design/project/hf-screens-A.jsx (lines 7-123). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte.
 *
 * Pages: src/app/app/page.tsx  fetches data and renders this.
 */
import { Phone, HF } from "@/components/hf";
import { ConnectedRemRow } from "../connected-rem-row";
import type { ReactNode } from "react";
import { TodayPokeAlert } from "./today-poke-alert.client";

export interface HfTodayItem {
  id: string;
  title: string;
  /** "6:30 · #早起鸟" — composed by caller. */
  sub?: string;
  done?: boolean;
  /** Optional right-side `time` like "还有 12m". */
  time?: string;
  visibility?: "PRIVATE" | "GROUP";
  isPinned?: boolean;
  dueAt?: string | null;
  /** Optional poke / claim chip. */
  chipKind?: "claim" | "poke" | null;
  chipLabel?: string;
}

export interface HfTodayPokeAlert {
  id: string;
  fromName: string;
  message: string;
  /** "2 分前" — caller computes. */
  agoText: string;
  /** "读书会 · 还可以补上" — caller composes. */
  contextText: string;
  /** Where 收下，去做 routes. */
  acceptHref: string | null;
}

export interface HfTodayProps {
  /** "星期四 · 4 月 30 日" — caller formats per user TZ. */
  meta: string;
  /** 头像 trailing slot — caller's name + slot index. */
  user: { name: string; slot: number };
  /** 副标题：N 个朋友想到你 · M 件小赢已收下 · K 件待办 */
  friendsThinkingCount: number;
  doneTodayCount: number;
  todoCount: number;
  /** 今日小赢 banner data. */
  streak: { days: number; shieldCards: number };
  /** Top unread poke (optional). */
  pokeAlert: HfTodayPokeAlert | null;
  /** 早上 / 晚上 buckets. */
  morning: HfTodayItem[];
  evening: HfTodayItem[];
  /** Already-completed today titles (for the dashed peek). */
  finished: { id: string; title: string }[];
  /** Long-press → 分享到群组 picker target list. */
  groupsAvailable?: Array<{
    id: string;
    name: string;
    coverEmoji: string | null;
  }>;
  /** Slot for QuickAdd / EmptyState etc., rendered AFTER the today
   *  banner and BEFORE the morning/evening sections. */
  topSlot?: ReactNode;
  /** Slot rendered when both buckets are empty AND there's nothing
   *  finished today (HfL2Empty). */
  emptyFallback?: ReactNode;
}

function chipFor(item: HfTodayItem): ReactNode {
  if (!item.chipKind || !item.chipLabel) return undefined;
  return (
    <span
      className={`hf-chip ${item.chipKind}`}
      data-testid={`reminder-row-${item.id}-${item.chipKind}-chip`}
    >
      {item.chipLabel}
    </span>
  );
}

export function HfToday({
  meta,
  user,
  friendsThinkingCount,
  doneTodayCount,
  todoCount,
  streak,
  pokeAlert,
  morning,
  evening,
  finished,
  groupsAvailable = [],
  topSlot,
  emptyFallback,
}: HfTodayProps) {
  const hasContent = morning.length + evening.length + finished.length > 0;
  return (
    <Phone>
      <div
        style={{
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
        }}
      >
        {/* header */}
        <div style={{ padding: "14px 18px 4px" }}>
          <div className="h-meta" data-testid="today-date-meta">
            {meta}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <div className="h-display" data-testid="app-greeting">
              今天
            </div>
            <HF.Av name={user.name} size={32} i={user.slot} />
          </div>
          <div
            className="h-body"
            style={{ marginTop: 4 }}
            data-testid="today-summary"
          >
            <span style={{ color: "var(--poke)" }}>
              {friendsThinkingCount > 0
                ? `${friendsThinkingCount} 个朋友想到你`
                : "没人催你"}
            </span>{" "}
            ·{" "}
            <b data-testid="banner-done-count">{doneTodayCount}</b> 件小赢已收下
            · {todoCount} 件待办
          </div>
        </div>

        <div
          style={{ flex: 1, overflowY: "auto", padding: "10px 14px 70px" }}
        >
          {/* 今日小赢 — celebrating wins right at top */}
          <div
            className="hf-box thick"
            data-testid="today-banner"
            style={{
              padding: "8px 12px",
              background: "var(--ok-soft)",
              borderColor: "var(--ok)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{ display: "inline-flex", color: "var(--ok)" }}
            >
              <HF.Icon name="confetti" size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="h-row"
                style={{ fontSize: 15, fontFamily: "var(--hand-2)" }}
              >
                你今天已经搞定 <b>{doneTodayCount} 件</b>{" "}
                {doneTodayCount > 0 ? "啦" : "— 慢慢来"}
              </div>
              <div className="h-meta" style={{ color: "var(--ok)" }}>
                连胜 <span data-testid="banner-streak">{streak.days}</span> 天 ·
                还剩 <span data-testid="banner-shield">{streak.shieldCards}</span>{" "}
                张保护卡
              </div>
            </div>
            <span
              className="hf-chip"
              style={{
                borderColor: "var(--ok)",
                color: "var(--ok)",
                fontSize: 12,
                gap: 3,
              }}
            >
              <HF.Icon name="shield" size={11} /> ×{streak.shieldCards}
            </span>
          </div>

          {/* poke alert — softened, no red squig */}
          {pokeAlert && <TodayPokeAlert alert={pokeAlert} />}

          {topSlot && <div style={{ marginTop: 12 }}>{topSlot}</div>}

          {/* morning group */}
          {morning.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 18,
                  gap: 8,
                }}
              >
                <span style={{ display: "inline-flex" }}>
                  <HF.Icon name="sun" size={15} />
                </span>
                <div className="h-h3">早上</div>
                <div className="h-meta" style={{ marginLeft: "auto" }}>
                  {morning.length} 件 ·{" "}
                  {morning.filter((r) => r.done).length} 完成
                </div>
              </div>
              <div
                className="hf-box"
                style={{ padding: "4px 14px", marginTop: 6 }}
                data-testid="today-list-morning"
              >
                {morning.map((r, i) => (
                  <ConnectedRemRow
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    sub={r.sub}
                    done={r.done}
                    time={r.time}
                    chip={chipFor(r)}
                    last={i === morning.length - 1}
                    visibility={r.visibility ?? "PRIVATE"}
                    isPinned={r.isPinned}
                    dueAt={r.dueAt}
                    groupsAvailable={groupsAvailable}
                    testid={`reminder-row-${r.id}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* evening */}
          {evening.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 16,
                  gap: 8,
                }}
              >
                <span style={{ display: "inline-flex" }}>
                  <HF.Icon name="moon" size={15} />
                </span>
                <div className="h-h3">晚上</div>
                <div className="h-meta" style={{ marginLeft: "auto" }}>
                  {evening.length} 件
                </div>
              </div>
              <div
                className="hf-box"
                style={{ padding: "4px 14px", marginTop: 6 }}
                data-testid="today-list-evening"
              >
                {evening.map((r, i) => (
                  <ConnectedRemRow
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    sub={r.sub}
                    done={r.done}
                    time={r.time}
                    chip={chipFor(r)}
                    last={i === evening.length - 1}
                    visibility={r.visibility ?? "PRIVATE"}
                    isPinned={r.isPinned}
                    dueAt={r.dueAt}
                    groupsAvailable={groupsAvailable}
                    testid={`reminder-row-${r.id}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* finished peek — celebrate */}
          {finished.length > 0 && (
            <div
              className="hf-box"
              style={{ marginTop: 18, padding: 10, borderStyle: "dashed" }}
              data-testid="today-finished"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{ display: "inline-flex", color: "var(--ok)" }}
                >
                  <HF.Icon name="check" size={13} />
                </span>
                <div className="h-meta" style={{ color: "var(--ok)" }}>
                  今日已收下 {doneTodayCount} 件 · 真不错
                </div>
                <span
                  className="h-meta"
                  style={{
                    marginLeft: "auto",
                    color: "var(--claim)",
                  }}
                >
                  查看
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginTop: 8,
                }}
              >
                {finished.map((c) => (
                  <span
                    key={c.id}
                    className="hf-chip dim"
                    style={{ textDecoration: "line-through" }}
                  >
                    {c.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* empty fallback (HfL2Empty) when there's literally nothing */}
          {!hasContent && emptyFallback}
        </div>
      </div>
    </Phone>
  );
}
