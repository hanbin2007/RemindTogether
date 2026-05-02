/**
 * 1:1 port of `window.HfGroupDetail` from
 * design/project/hf-screens-A.jsx (lines 251-376). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av name=... i=... size=...>     → <HF.Av name=... i=... size=... />
 *   - <AvStack people=... ... />       → <HF.AvStack ... />
 *   - hardcoded sample data            → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * "想搭把手" CTA in the leaderboard keeps wiring through the existing
 * `<CheerButton>` client component.
 *
 * Pages: src/app/app/groups/[id]/page.tsx fetches data and renders this.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, HF, RemRow } from "@/components/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import { CheerButton } from "@/app/app/groups/[id]/cheer-button";
import type { HfTodayItem } from "./HfToday";

const TINTS = [
  "var(--rt-av-0)",
  "var(--rt-av-1)",
  "var(--rt-av-2)",
  "var(--rt-av-3)",
  "var(--rt-av-4)",
  "var(--rt-av-5)",
  "var(--rt-av-6)",
];

const MEDALS = ["🥇", "🥈", "🥉"];

const TABS: { key: HfGroupDetailProps["activeTab"]; label: string }[] = [
  { key: "list", label: "清单" },
  { key: "leaderboard", label: "加油榜" },
  { key: "history", label: "历史" },
  { key: "settings", label: "设置" },
];

export interface HfGroupDetailGroup {
  id: string;
  name: string;
  coverEmoji?: string | null;
  memberCount: number;
  daysSinceCreated: number;
}

export interface HfGroupDetailMember {
  userId: string;
  displayName: string;
  slot: number;
}

export interface HfGroupDetailLeader {
  userId: string;
  displayName: string;
  doneCount: number;
  slot: number;
}

export interface HfGroupHistoryWeek {
  weekStart: string;
  totalDone: number;
  members: { userId: string; displayName: string; doneCount: number }[];
}

export interface HfGroupDetailProps {
  group: HfGroupDetailGroup;
  members: HfGroupDetailMember[];
  reminders: HfTodayItem[];
  leaderboard: HfGroupDetailLeader[];
  progressDoneToday: number;
  progressTotalToday: number;
  activeTab: "list" | "leaderboard" | "history" | "settings";
  isOwner: boolean;
  history?: HfGroupHistoryWeek[];
  /** Slot rendered inside the list tab below the reminder box (e.g. inline form). */
  topSlot?: ReactNode;
  onComplete?: (id: string) => void;
  onContextMenu?: (id: string) => void;
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

export function HfGroupDetail({
  group,
  members,
  reminders,
  leaderboard,
  progressDoneToday,
  progressTotalToday,
  activeTab,
  isOwner,
  history = [],
  topSlot,
  onComplete,
  onContextMenu,
}: HfGroupDetailProps) {
  const tintIndex = avatarSlot(group.id);
  const progressPct =
    progressTotalToday > 0
      ? Math.round((progressDoneToday / progressTotalToday) * 100)
      : 0;
  return (
    <Phone>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "14px 14px 4px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link
            href="/app/groups"
            className="hf-btn ghost"
            style={{ padding: "4px 8px", fontSize: 14 }}
          >
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="h-meta">
              第 {group.daysSinceCreated} 天 · {group.memberCount} 人
              {isOwner ? " · 你是群主" : ""}
            </div>
          </div>
          <Link
            href={`/app/groups/${group.id}/settings`}
            className="hf-btn ghost"
            style={{
              padding: "6px 10px",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <HF.Icon name="dots" size={14} />
          </Link>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                border: "1.6px solid var(--line)",
                borderRadius: "16px 8px 14px 6px / 6px 14px 8px 16px",
                background: TINTS[tintIndex],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(-3deg)",
                fontSize: 28,
              }}
            >
              {group.coverEmoji ?? "📌"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h-h1" data-testid="app-greeting">
                {group.name}
              </div>
              <div className="h-body">
                {progressTotalToday > 0
                  ? `今天 ${progressDoneToday}/${progressTotalToday} · 一起冲`
                  : "还没有群提醒，加一个让大家一起看到"}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <HF.AvStack
              people={members.slice(0, 5).map((m) => ({
                name: m.displayName,
                i: m.slot,
              }))}
              max={5}
              size={26}
            />
            {group.memberCount > 5 && (
              <span className="h-meta">+{group.memberCount - 5}</span>
            )}
            <Link
              href={`/app/groups/${group.id}/invite`}
              data-testid="group-invite-link"
              className="hf-btn ghost"
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <HF.Icon name="plus" size={12} /> 邀请
            </Link>
          </div>
        </div>

        {/* tabs */}
        <div
          data-testid="group-tabs"
          style={{
            display: "flex",
            gap: 16,
            padding: "14px 18px 6px",
            borderBottom: "1.3px dashed var(--ink-faint)",
            margin: "10px 14px 0",
          }}
        >
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <Link
                key={t.key}
                href={
                  t.key === "list"
                    ? `/app/groups/${group.id}`
                    : `/app/groups/${group.id}?tab=${t.key}`
                }
                data-testid={`group-tab-${t.key}`}
                data-active={isActive ? "true" : undefined}
                className="h-row"
                style={{
                  fontSize: 15,
                  paddingBottom: 4,
                  color: isActive ? "var(--ink)" : "var(--ink-mute)",
                  borderBottom: isActive
                    ? "2.4px solid var(--ink)"
                    : "2.4px solid transparent",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div
          style={{ flex: 1, overflowY: "auto", padding: "10px 14px 130px" }}
        >
          {activeTab === "list" && (
            <>
              {/* shared list */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div className="h-meta">今天</div>
                <div className="h-meta" style={{ marginLeft: "auto" }}>
                  {progressDoneToday}/{progressTotalToday} 完成
                </div>
              </div>
              <div className="hf-bar" style={{ marginTop: 6 }}>
                <i style={{ width: `${progressPct}%` }} />
              </div>

              <div
                className="hf-box"
                style={{ padding: "4px 12px", marginTop: 12 }}
                data-testid="group-reminder-list"
              >
                {reminders.length === 0 ? (
                  <p
                    className="h-body"
                    style={{
                      color: "var(--ink-mute)",
                      padding: "12px 0",
                    }}
                  >
                    还没有群提醒，加一个让大家一起看到。
                  </p>
                ) : (
                  reminders.map((r, i) => (
                    <RemRow
                      key={r.id}
                      href={`/app/reminders/${r.id}`}
                      title={r.title}
                      sub={r.sub}
                      done={r.done}
                      time={r.time}
                      chip={chipFor(r)}
                      last={i === reminders.length - 1}
                      onComplete={
                        onComplete ? () => onComplete(r.id) : undefined
                      }
                      onContextMenu={
                        onContextMenu
                          ? (e) => {
                              e.preventDefault();
                              onContextMenu(r.id);
                            }
                          : undefined
                      }
                      testid={`reminder-row-${r.id}`}
                    />
                  ))
                )}
              </div>

              {topSlot && <div style={{ marginTop: 12 }}>{topSlot}</div>}

              {/* mini cheer board — celebrate top, soft poke for last */}
              {leaderboard.length > 0 && (
                <div
                  className="hf-box dim"
                  style={{ marginTop: 14, padding: 12 }}
                  data-testid="leaderboard"
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        color: "var(--ok)",
                      }}
                    >
                      <HF.Icon name="confetti" size={14} />
                    </span>
                    <div className="h-h3" style={{ marginLeft: 6 }}>
                      本周加油榜
                    </div>
                    <Link
                      href={`/app/groups/${group.id}?tab=leaderboard`}
                      className="h-meta"
                      style={{ marginLeft: "auto" }}
                    >
                      看全榜 ›
                    </Link>
                  </div>
                  {leaderboard.slice(0, 3).map((p, i) => (
                    <div
                      key={p.userId}
                      data-testid={`leaderboard-row-${p.userId}`}
                      data-rank={i + 1}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 10,
                      }}
                    >
                      <div
                        className="h-h3"
                        style={{
                          width: 18,
                          color:
                            i === 0 ? "var(--ok)" : "var(--ink-mute)",
                        }}
                      >
                        {i < 3 ? MEDALS[i] : i + 1}
                      </div>
                      <HF.Av
                        name={p.displayName}
                        i={p.slot}
                        size={28}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="h-row"
                          style={{ fontSize: 15 }}
                        >
                          {p.displayName}
                        </div>
                        <div className="h-meta">
                          {p.doneCount} 件已收下
                        </div>
                      </div>
                      {p.doneCount === 0 ? (
                        <CheerButton
                          groupId={group.id}
                          toUserId={p.userId}
                          testid={`leaderboard-row-${p.userId}-cheer`}
                        />
                      ) : (
                        <span
                          className="h-num"
                          style={{ color: "var(--ok)" }}
                        >
                          {p.doneCount}
                        </span>
                      )}
                    </div>
                  ))}
                  <div
                    className="h-meta"
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: "1.3px dashed var(--ink-faint)",
                      fontStyle: "italic",
                    }}
                  >
                    ※ 没有「赖账榜」，谁都有忘的时候
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "leaderboard" && (
            <div data-testid="leaderboard">
              {leaderboard.length === 0 ? (
                <p
                  className="h-body"
                  style={{
                    color: "var(--ink-mute)",
                    padding: "32px 0",
                  }}
                >
                  还没有完成记录 — 第一件事由你开始。
                </p>
              ) : (
                <>
                  <div className="h-meta">WEEKLY · 加油榜</div>
                  <ul
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {leaderboard.map((p, i) => (
                      <li
                        key={p.userId}
                        data-testid={`leaderboard-row-${p.userId}`}
                        data-rank={i + 1}
                        className="hf-box"
                        style={{
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          className="h-h3"
                          style={{
                            width: 18,
                            color:
                              i === 0 ? "var(--ok)" : "var(--ink-mute)",
                          }}
                        >
                          {i < 3 ? MEDALS[i] : i + 1}
                        </div>
                        <HF.Av
                          name={p.displayName}
                          i={p.slot}
                          size={28}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="h-row"
                            style={{ fontSize: 15 }}
                          >
                            {p.displayName}
                          </div>
                          <div className="h-meta">
                            {p.doneCount} 件已收下
                          </div>
                        </div>
                        {p.doneCount === 0 ? (
                          <CheerButton
                            groupId={group.id}
                            toUserId={p.userId}
                            testid={`leaderboard-row-${p.userId}-cheer`}
                          />
                        ) : (
                          <span
                            className="h-num"
                            style={{ color: "var(--ok)" }}
                          >
                            {p.doneCount} 件
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="h-meta"
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: "1.3px dashed var(--ink-faint)",
                      fontStyle: "italic",
                    }}
                  >
                    ※ 没有「赖账榜」，谁都有忘的时候
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div data-testid="group-history">
              {history.length === 0 ? (
                <p
                  className="h-body"
                  style={{
                    color: "var(--ink-mute)",
                    padding: "32px 0",
                  }}
                >
                  还没有历史回顾 — 完成过的提醒会按周归档到这里。
                </p>
              ) : (
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {history.map((w) => (
                    <li
                      key={w.weekStart}
                      data-testid={`history-week-${w.weekStart}`}
                      className="hf-box"
                      style={{ padding: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                        }}
                      >
                        <div className="h-h3">{w.weekStart}</div>
                        <span
                          className="h-meta"
                          style={{ marginLeft: "auto" }}
                        >
                          共 {w.totalDone} 件
                        </span>
                      </div>
                      {w.members.length > 0 ? (
                        <ul
                          style={{
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {w.members.map((m) => (
                            <li
                              key={m.userId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                className="h-row"
                                style={{ fontSize: 14 }}
                              >
                                {m.displayName}
                              </span>
                              <span
                                className="h-meta"
                                style={{ marginLeft: "auto" }}
                              >
                                {m.doneCount} 件
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p
                          className="h-body"
                          style={{
                            fontStyle: "italic",
                            marginTop: 6,
                            fontSize: 13,
                          }}
                        >
                          这一周没人完成 — 也许大家都在歇着。
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Link
                href={`/app/groups/${group.id}/settings`}
                data-testid="group-settings-link"
                className="hf-btn primary"
                style={{
                  padding: "10px 14px",
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                打开群设置 →
              </Link>
            </div>
          )}
        </div>

        {/* bottom action bar */}
        <div
          data-testid="group-action-bar"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "37.5rem",
            bottom: 56,
            background: "var(--paper)",
            borderTop: "1.3px dashed var(--ink-faint)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: "37.5rem",
              margin: "0 auto",
              padding: "10px 14px",
              display: "flex",
              gap: 8,
            }}
          >
            <Link
              href={`#group-add-${group.id}`}
              data-testid="group-add-cta"
              className="hf-btn primary"
              style={{
                flex: 1,
                fontSize: 15,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <HF.Icon name="plus" size={14} /> 加给大家的事
            </Link>
            <Link
              href={`/app/groups/${group.id}/poke`}
              data-testid="group-poke-cta"
              className="hf-btn poke"
              style={{
                fontSize: 15,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              群拍 <HF.Icon name="boltFilled" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </Phone>
  );
}
