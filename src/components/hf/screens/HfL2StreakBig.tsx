/**
 * 1:1 port of `window.HfL2StreakBig` from
 * design/project/hf-screens-L2.jsx (lines 1133-1215). The JSX below is
 * a literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design hard-codes the 7-day celebration; we keep the same layout but
 * swap labels / trophy / gradient based on `currentStreak >= 7`.
 *
 * Pages: src/app/app/me/streak/page.tsx fetches data and renders this.
 */
import Link from "next/link";
import { Phone, HF } from "@/components/hf";

export type StreakDayStatus = "DONE" | "PROTECTED" | "SKIPPED" | "MISSED";

export interface HfL2StreakBigProps {
  currentStreak: number;
  longest: number;
  shieldCards: number;
  shieldCardCap: number;
  /** Most-recent ~30 closed days, oldest first. */
  recent: Array<{ date: string; status: StreakDayStatus }>;
  /** "30 天 — 一个月连胜" + remaining days. Caller computes. */
  nextMilestone: { days: number; remaining: number };
}

const SPARKLES: Array<[number, number, number, number]> = [
  [24, 50, -15, 18],
  [270, 70, 12, 14],
  [60, 110, -8, 16],
  [250, 160, 10, 14],
  [30, 220, 0, 12],
  [260, 280, -12, 14],
  [200, 50, 8, 12],
  [90, 480, 6, 14],
  [240, 540, -6, 16],
];

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function HfL2StreakBig({
  currentStreak,
  longest,
  shieldCards,
  shieldCardCap,
  recent,
  nextMilestone,
}: HfL2StreakBigProps) {
  const reachedWeek = currentStreak >= 7;
  const last7 = recent.slice(-7);
  const milestoneTitle = reachedWeek
    ? `${nextMilestone.days} 天 — 一个月连胜`
    : `${nextMilestone.days} 天 — 一周连胜`;

  return (
    <Phone>
      <div
        data-testid="streak-page"
        style={{
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: reachedWeek
            ? "linear-gradient(180deg, var(--poke-soft) 0%, var(--paper) 60%)"
            : "var(--paper)",
        }}
      >
        {/* sparkle scatter — SVG */}
        {reachedWeek &&
          SPARKLES.map(([x, y, r, sz], i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `rotate(${r}deg)`,
                color: "var(--poke)",
                opacity: 0.7,
              }}
            >
              <HF.Icon name="sparkle" size={sz} />
            </span>
          ))}

        <div
          style={{
            padding: "60px 22px 0",
            textAlign: "center",
            position: "relative",
          }}
        >
          <Link
            href="/app/me"
            data-testid="streak-back"
            className="h-meta"
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ‹ 我
          </Link>

          <div
            className="h-meta"
            style={{ color: "var(--poke)", letterSpacing: 2, fontSize: 13 }}
          >
            ★ {currentStreak} 天 ★
          </div>
          <div
            className="h-display"
            data-testid="streak-title"
            style={{
              fontSize: reachedWeek ? 48 : 38,
              marginTop: 6,
              lineHeight: 1.05,
            }}
          >
            {reachedWeek ? "一周连胜！" : `连胜 ${currentStreak} 天`}
          </div>
          <div
            className="h-body"
            style={{
              fontFamily: "var(--hand-2)",
              fontSize: 17,
              marginTop: 8,
            }}
          >
            {reachedWeek
              ? "你坚持了一整周 — 真的不容易"
              : "慢慢来 — 不急，节奏由你"}
          </div>

          {/* trophy sticker */}
          <div
            className="hf-box thick"
            style={{
              width: 140,
              height: 140,
              padding: 0,
              margin: "24px auto 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--paper)",
              transform: "rotate(-3deg)",
              fontSize: 70,
              boxShadow: "4px 6px 0 var(--line)",
            }}
          >
            {reachedWeek ? "🏆" : "🌱"}
          </div>

          {/* streak grid */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginTop: 24,
            }}
          >
            {WEEKDAYS.map((d, i) => {
              const day = last7[i];
              const filled =
                day?.status === "DONE" || day?.status === "PROTECTED";
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    data-testid={`streak-7day-${i}`}
                    style={{
                      width: 30,
                      height: 36,
                      border: "1.5px solid var(--line)",
                      borderRadius:
                        "6px 4px 7px 5px / 5px 7px 4px 6px",
                      background: filled ? "var(--ok)" : "var(--paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: filled ? "white" : "var(--ink-faint)",
                      fontFamily: "var(--hand-2)",
                      transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg)`,
                    }}
                  >
                    {filled ? "✓" : ""}
                  </div>
                  <div className="h-meta" style={{ fontSize: 10, marginTop: 2 }}>
                    {d}
                  </div>
                </div>
              );
            })}
          </div>

          {/* recent 30-day strip */}
          <div
            className="hf-box"
            style={{
              marginTop: 24,
              marginLeft: 12,
              marginRight: 12,
              padding: 10,
              background: "var(--paper)",
              textAlign: "left",
            }}
          >
            <div className="h-meta">最近 30 天</div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginTop: 8,
                justifyContent: "flex-start",
              }}
            >
              {recent.length === 0 ? (
                <div
                  className="h-body"
                  style={{ fontStyle: "italic", color: "var(--ink-mute)" }}
                >
                  还没有完整的天 — 开始记一件事吧。
                </div>
              ) : (
                recent.map((d, i) => {
                  let cls = "hf-dot";
                  let extraStyle: { background?: string; borderColor?: string } = {};
                  if (d.status === "DONE") cls += " l3";
                  else if (d.status === "PROTECTED") {
                    extraStyle = {
                      background: "var(--claim)",
                      borderColor: "var(--claim)",
                    };
                  } else if (d.status === "SKIPPED") cls += " l1";
                  else if (d.status === "MISSED") cls += " x";
                  return (
                    <span
                      key={d.date}
                      className={cls}
                      data-testid={`streak-day-${d.date}`}
                      data-status={d.status}
                      title={`${d.date} · ${d.status}`}
                      style={{
                        width: 18,
                        height: 18,
                        animationDelay: `${Math.min(i * 18, 320)}ms`,
                        ...extraStyle,
                      }}
                    />
                  );
                })
              )}
            </div>
            <div className="h-meta" style={{ marginTop: 8 }}>
              最长 {longest} 天 · 保护卡 {shieldCards}/{shieldCardCap}
            </div>
          </div>

          {/* next milestone */}
          <div
            className="hf-box dashed"
            style={{
              marginTop: 24,
              marginLeft: 12,
              marginRight: 12,
              padding: 10,
              background: "var(--paper)",
              textAlign: "left",
            }}
          >
            <div className="h-meta">下一个里程碑</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <HF.Icon name="moon" size={20} color="var(--claim)" />
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 14 }}>
                  {milestoneTitle}
                </div>
                <div className="h-meta">
                  还差 {Math.max(nextMilestone.remaining, 0)} 天 · 不急
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 18,
              justifyContent: "center",
            }}
          >
            <Link
              href="/app"
              data-testid="streak-share"
              className="hf-btn primary"
              style={{ padding: "10px 22px" }}
            >
              分享给小群
            </Link>
            <Link
              href="/app/me"
              data-testid="streak-close"
              className="hf-btn ghost"
              style={{ padding: "10px 18px" }}
            >
              收下
            </Link>
          </div>
        </div>
      </div>
    </Phone>
  );
}
