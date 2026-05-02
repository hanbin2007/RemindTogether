/**
 * Notification inbox screen, in the hand-drawn design language of
 * `window.HfL2Notif` (design/project/hf-screens-L2.jsx lines 982-1080)
 * combined with the Notif row primitive from hf-screens-B.jsx
 * (lines 517-544). The page header (back + 通知 + 全部已读) and
 * segmented filter chips (全部 / 未读 / 今天 / 拍我) match the user-
 * facing inbox spec; each row is a literal copy of the design's `Notif`
 * component (32×32 tinted icon box + bold name + soft-color title +
 * #group chip + time, with mark-read / link affordances).
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                   → <Phone>
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded sample `Notif` calls    → typed `items: HfNotifItem[]`
 *
 * className + inline styles + structure preserved byte-for-byte.
 * Existing testids (`inbox-list`, `inbox-empty`, `inbox-row-${id}`,
 * `inbox-row-${id}-link`, `inbox-row-${id}-mark-read`, `inbox-mark-all`)
 * are preserved so the existing E2E suite keeps passing.
 *
 * Pages: src/app/app/me/notifications/page.tsx fetches data and renders
 * this.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, HF } from "@/components/hf";
import type { IconName } from "@/components/sketch/icon";

export type HfNotifKind =
  | "POKE_RECEIVED"
  | "REMINDER_CLAIMED_BY_OTHER"
  | "REMINDER_COMPLETED_BY_OTHER"
  | "GROUP_INVITED"
  | "STREAK_MILESTONE"
  | "COMMENT_NEW"
  | "REACTION_NEW";

export interface HfNotifItem {
  id: string;
  kind: HfNotifKind;
  /** Actor name — `null` for system entries (streak milestones). */
  who: string | null;
  /** Optional group name — chip on the right. */
  group: string | null;
  /** "拍了拍你" / "认领了" / etc. */
  title: string;
  /** Secondary text (excerpt or reminder title). */
  sub: string | null;
  /** Pre-formatted relative time, e.g. "2 分前". */
  time: string;
  /** Where tap navigates — `null` means non-clickable. */
  href: string | null;
  /** When the notification was created (used for grouping by section). */
  createdAt: Date;
  /** `null` = unread, otherwise read. */
  readAt: Date | null;
}

export type HfNotifFilter = "all" | "unread" | "today" | "poke";

export interface HfL2NotifProps {
  items: HfNotifItem[];
  /** Total unread — drives the "全部已读 (N)" trailing button. */
  unreadCount: number;
  /** Active filter chip. */
  activeFilter: HfNotifFilter;
  /** Where the back-arrow points. */
  backHref: string;
  /** Optional slot for the "全部已读" form (server action wrapper). */
  markAllSlot?: ReactNode;
  /** Optional slot for the per-row mark-read affordance. */
  markReadSlot?: (item: HfNotifItem) => ReactNode;
}

interface IconCfg {
  ic: IconName;
  c: string;
  bg: string;
}

const KIND_CFG: Record<HfNotifKind, IconCfg> = {
  POKE_RECEIVED: { ic: "wave", c: "var(--poke)", bg: "var(--poke-soft)" },
  REMINDER_CLAIMED_BY_OTHER: {
    ic: "handshake",
    c: "var(--claim)",
    bg: "var(--claim-soft)",
  },
  REMINDER_COMPLETED_BY_OTHER: {
    ic: "check",
    c: "var(--ok)",
    bg: "var(--ok-soft)",
  },
  GROUP_INVITED: { ic: "plus", c: "var(--ink)", bg: "var(--paper-2)" },
  STREAK_MILESTONE: {
    ic: "trendDown",
    c: "var(--ink-soft)",
    bg: "var(--paper-2)",
  },
  COMMENT_NEW: { ic: "chat", c: "var(--claim)", bg: "var(--claim-soft)" },
  REACTION_NEW: { ic: "wave", c: "var(--poke)", bg: "var(--poke-soft)" },
};

const FILTERS: { key: HfNotifFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "today", label: "今天" },
  { key: "poke", label: "拍我" },
];

function filterHref(key: HfNotifFilter): string {
  return key === "all"
    ? "/app/me/notifications"
    : `/app/me/notifications?filter=${key}`;
}

function sectionFor(d: Date): "刚刚" | "今天" | "更早" {
  const ms = Date.now() - d.getTime();
  if (ms < 30 * 60_000) return "刚刚";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (d.getTime() >= start.getTime()) return "今天";
  return "更早";
}

export function HfL2Notif({
  items,
  unreadCount,
  activeFilter,
  backHref,
  markAllSlot,
  markReadSlot,
}: HfL2NotifProps) {
  // Group rows by section while keeping their original order (already
  // sorted desc by createdAt by the caller).
  const sections: { label: string; rows: HfNotifItem[] }[] = [];
  for (const item of items) {
    const label = sectionFor(item.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.label === label) {
      last.rows.push(item);
    } else {
      sections.push({ label, rows: [item] });
    }
  }

  return (
    <Phone>
      <div
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1.5px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link
            href={backHref}
            style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}
          >
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="h-meta">收件箱</div>
            <div className="h-display" style={{ fontSize: 22 }}>
              通知
            </div>
          </div>
          {unreadCount > 0 &&
            (markAllSlot ?? (
              <span
                data-testid="inbox-mark-all"
                className="h-meta"
                style={{ color: "var(--claim)" }}
              >
                全部已读 ({unreadCount})
              </span>
            ))}
        </div>

        {/* segmented filters */}
        <div
          style={{ display: "flex", gap: 4, padding: "8px 14px 0" }}
          data-testid="inbox-filters"
        >
          {FILTERS.map((f) => {
            const active = f.key === activeFilter;
            return (
              <Link
                key={f.key}
                href={filterHref(f.key)}
                data-testid={`inbox-filter-${f.key}`}
                data-active={active ? "true" : undefined}
                className={`hf-chip ${active ? "fill" : ""}`}
                style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div
          style={{
            padding: "10px 14px 70px",
            overflowY: "auto",
            height: "calc(100% - 56px - 36px)",
          }}
        >
          {items.length === 0 ? (
            <div
              data-testid="inbox-empty"
              className="hf-box dashed"
              style={{
                marginTop: 18,
                padding: 18,
                textAlign: "center",
                fontFamily: "var(--hand-2)",
                fontSize: 14,
                color: "var(--ink-mute)",
              }}
            >
              收件箱空着 — 慢慢来。
            </div>
          ) : (
            <ul data-testid="inbox-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sections.map((sec, sIdx) => (
                <li key={sec.label}>
                  <div
                    className="h-meta"
                    style={{ marginTop: sIdx === 0 ? 4 : 14 }}
                  >
                    {sec.label}
                  </div>
                  <div
                    className="hf-box"
                    style={{ marginTop: 6, padding: "4px 12px" }}
                  >
                    {sec.rows.map((item, i, a) => {
                      const cfg = KIND_CFG[item.kind];
                      const isUnread = item.readAt === null;
                      const last = i === a.length - 1;
                      const inner = (
                        <>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: 14,
                              borderRadius:
                                "8px 5px 9px 4px / 4px 9px 5px 8px",
                              border: `1.5px solid ${cfg.c}`,
                              background: cfg.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: cfg.c,
                              flexShrink: 0,
                            }}
                          >
                            <HF.Icon name={cfg.ic} size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="h-row"
                              style={{ fontSize: 14 }}
                            >
                              {item.who && <b>{item.who}</b>}{" "}
                              <span
                                style={{
                                  color: "var(--ink-soft)",
                                  fontWeight: 400,
                                }}
                              >
                                {item.title}
                              </span>
                              {item.group && (
                                <>
                                  {" "}·{" "}
                                  <span style={{ color: cfg.c }}>
                                    #{item.group}
                                  </span>
                                </>
                              )}
                            </div>
                            {item.sub && (
                              <div className="h-meta">{item.sub}</div>
                            )}
                          </div>
                          <div
                            className="h-meta"
                            style={{ alignSelf: "flex-start", marginTop: 4 }}
                          >
                            {item.time}
                          </div>
                        </>
                      );
                      return (
                        <div
                          key={item.id}
                          data-testid={`inbox-row-${item.id}`}
                          data-kind={item.kind}
                          data-unread={isUnread ? "true" : "false"}
                          className="hf-row"
                          style={{
                            borderBottom: last
                              ? "none"
                              : "1.3px dashed var(--ink-faint)",
                            opacity: isUnread ? 1 : 0.7,
                            position: "relative",
                          }}
                        >
                          {item.href ? (
                            <Link
                              href={item.href}
                              data-testid={`inbox-row-${item.id}-link`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flex: 1,
                                minWidth: 0,
                                color: "inherit",
                                textDecoration: "none",
                              }}
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {inner}
                            </div>
                          )}
                          {markReadSlot && isUnread && markReadSlot(item)}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Phone>
  );
}
