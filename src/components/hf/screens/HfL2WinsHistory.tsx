/**
 * 1:1 port of `window.HfL2WinsHistory` from
 * design/project/hf-screens-L2.jsx (lines 828-906). Standard
 * mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (kept)
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded daily recap blocks      → typed `weeks` (week-by-week
 *     recap, each with weekStart / doneCount / 7-day mini grid)
 *   - hardcoded footer                  → typed `monthSummaries`
 *
 * The design's structure (header strip with back/share + body card list)
 * is preserved byte-for-byte; we just swap the per-card *contents* from
 * day-with-checklist into week-with-mini-grid, per the page spec.
 *
 * Pages: src/app/app/me/wins/page.tsx fetches StreakDay rows for the
 * last 8 weeks and renders this.
 */
import { Phone, HF } from "@/components/hf";

export type HfL2WinsDayStatus = "DONE" | "PROTECTED" | "SKIPPED" | "MISSED" | "NONE";

export interface HfL2WinsDay {
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** How many small wins logged for that day. */
  doneCount: number;
  status: HfL2WinsDayStatus;
}

export interface HfL2WinsWeek {
  /** ISO date of Monday for that week (UTC midnight). */
  weekStart: string;
  /** Sum of doneCount across the 7 days. */
  doneCount: number;
  /** Mon → Sun, length 7. */
  days: HfL2WinsDay[];
}

export interface HfL2WinsMonthSummary {
  /** "2026-04" */
  month: string;
  doneCount: number;
}

export interface HfL2WinsHistoryProps {
  /** Most-recent week first; up to 8 weeks. */
  weeks: HfL2WinsWeek[];
  /** Optional month roll-up shown at the bottom of the list. */
  monthSummaries?: HfL2WinsMonthSummary[];
}

/** Map a StreakDay status to an `hf-dot l1/l2/l3` modifier class. */
function dotClassFor(status: HfL2WinsDayStatus, doneCount: number): string {
  if (status === "DONE") {
    if (doneCount >= 4) return "hf-dot l3";
    if (doneCount >= 2) return "hf-dot l2";
    return "hf-dot l1";
  }
  if (status === "PROTECTED") return "hf-dot l1";
  if (status === "MISSED") return "hf-dot x";
  return "hf-dot";
}

/** "4/30" — short month/day for week headers. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function weekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${shortDate(weekStart)} — ${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
}

function monthLabel(month: string): string {
  // "2026-04" → "4 月"
  const [, mm] = month.split("-");
  return `${Number(mm)} 月`;
}

export function HfL2WinsHistory({
  weeks,
  monthSummaries = [],
}: HfL2WinsHistoryProps) {
  const totalThisWeek = weeks[0]?.doneCount ?? 0;
  const totalLastWeek = weeks[1]?.doneCount ?? 0;
  const delta = totalThisWeek - totalLastWeek;
  const deltaText =
    delta > 0
      ? `比上周 +${delta}`
      : delta < 0
        ? `比上周 ${delta}`
        : "比上周 持平";

  return (
    <Phone>
      <div data-testid="wins-page" style={{ height: "100%", background: "var(--paper)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 8px", borderBottom: "1.5px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="/app/me"
              data-testid="wins-back"
              className="h-meta"
              style={{ fontFamily: "var(--hand-2)", fontSize: 18, color: "var(--ink)", textDecoration: "none" }}
            >
              ‹
            </a>
            <div style={{ flex: 1 }}>
              <div className="h-meta">小赢</div>
              <div className="h-display" style={{ fontSize: 22 }}>我的小赢</div>
            </div>
            <a
              href="/app"
              data-testid="wins-share"
              className="hf-chip"
              style={{ fontSize: 12, textDecoration: "none" }}
            >
              分享 ›
            </a>
          </div>

          {/* big number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
            <span
              className="h-display"
              style={{ fontSize: 44, color: "var(--ok)" }}
              data-testid="wins-total-this-week"
            >
              {totalThisWeek}
            </span>
            <span className="h-meta">件 · {deltaText}</span>
          </div>
        </div>

        <div style={{ padding: "10px 14px", overflowY: "auto", height: "calc(100% - 110px)" }}>
          {weeks.length === 0 ? (
            <div
              className="h-meta"
              style={{ textAlign: "center", fontStyle: "italic", marginTop: 24 }}
              data-testid="wins-empty"
            >
              还没有完整的小赢 — 完成第一件吧
            </div>
          ) : (
            weeks.map((w, wi) => {
              const dim = wi >= 4 && w.doneCount === 0;
              return (
                <div
                  key={w.weekStart}
                  data-testid={`wins-week-${w.weekStart}`}
                  style={{ marginBottom: 14 }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="h-row" style={{ fontSize: 15 }}>
                      {wi === 0 ? "本周" : wi === 1 ? "上周" : `${wi + 1} 周前`}
                    </span>
                    <span className="h-meta">{weekRange(w.weekStart)}</span>
                    <span style={{ flex: 1 }} />
                    <span
                      className="hf-chip"
                      style={{
                        fontSize: 11,
                        background: "var(--ok-soft)",
                        borderColor: "var(--ok)",
                      }}
                    >
                      {w.doneCount} 件
                    </span>
                  </div>
                  <div
                    className="hf-box"
                    style={{
                      marginTop: 4,
                      padding: "8px 12px",
                      opacity: dim ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 6,
                      }}
                    >
                      {w.days.map((d) => (
                        <div
                          key={d.date}
                          data-testid={`wins-day-${d.date}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            className={dotClassFor(d.status, d.doneCount)}
                            style={{ width: 22, height: 22 }}
                            title={`${d.date} · ${d.status} · ${d.doneCount} 件`}
                          />
                          <span className="h-meta" style={{ fontSize: 10 }}>
                            {d.doneCount > 0 ? d.doneCount : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {monthSummaries.length > 0 && (
            <div
              className="hf-box dashed"
              style={{ marginTop: 6, padding: "8px 12px" }}
              data-testid="wins-month-summary"
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ display: "inline-flex", color: "var(--ok)" }}>
                  <HF.Icon name="check" size={13} />
                </span>
                <div className="h-meta">月度</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {monthSummaries.map((m) => (
                  <span
                    key={m.month}
                    data-testid={`wins-month-${m.month}`}
                    className="hf-chip"
                    style={{ fontSize: 12 }}
                  >
                    {monthLabel(m.month)} · {m.doneCount}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-meta" style={{ textAlign: "center", fontStyle: "italic", marginTop: 6 }}>
            ↓ 加载更早的小赢
          </div>
        </div>
      </div>
    </Phone>
  );
}
