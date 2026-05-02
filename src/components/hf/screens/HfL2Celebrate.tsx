/**
 * 1:1 port of `window.HfL2Celebrate` from
 * design/project/hf-screens-L2.jsx (lines 37-116). The JSX below is a
 * literal copy with the standard mechanical replacements:
 *
 *   - <Phone> wrapper                   → <Phone>
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. Adds
 * `data-testid` anchors that the existing /app/celebrate E2E suite keys
 * off of (`celebrate-page`, `celebrate-title`, `celebrate-share`,
 * `celebrate-close`) and `Link` wrappers around the two CTAs so they
 * actually navigate.
 *
 * Pages: src/app/app/celebrate/page.tsx fetches data and renders this.
 */
import Link from "next/link";
import { Phone, HF } from "@/components/hf";

export interface HfL2CelebrateProps {
  /** Streak BEFORE the bump (from `?prev=` query param). Renders "5 → 6 天". */
  prevStreak: number;
  /** Streak AFTER the bump (current). */
  currentStreak: number;
  /** Number of remaining shield cards — shown in the chip. */
  shieldCards: number;
  /** Completions today (post-bump). Renders "你今天搞定了 N 件 啦". */
  doneTodayCount: number;
  /** Where 关闭 routes (typically "/app"). */
  closeHref: string;
  /** Where 分享给群 routes (typically "/app"). */
  shareHref: string;
}

const SPARKLES: Array<[number, number, number, number]> = [
  [12, 60, -20, 18],
  [260, 80, 15, 14],
  [50, 120, -10, 16],
  [240, 180, 8, 14],
  [30, 240, 0, 12],
  [250, 280, -15, 16],
  [180, 60, 12, 12],
  [90, 380, 6, 14],
];

export function HfL2Celebrate({
  prevStreak,
  currentStreak,
  shieldCards,
  doneTodayCount,
  closeHref,
  shareHref,
}: HfL2CelebrateProps) {
  return (
    <Phone>
      <div
        data-testid="celebrate-page"
        style={{
          height: "100%",
          position: "relative",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        {/* dim faux bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(40,28,20,0.40)",
          }}
        />

        {/* sparkle scatter — SVG */}
        {SPARKLES.map(([x, y, r, sz], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `rotate(${r}deg)`,
              opacity: 0.7,
              color: "var(--poke)",
            }}
          >
            <HF.Icon name="sparkle" size={sz} />
          </span>
        ))}

        {/* center card */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: "50%",
            transform: "translateY(-55%)",
          }}
        >
          <div
            className="hf-box thick tilt-l"
            style={{
              padding: "22px 18px 18px",
              background: "var(--ok-soft)",
              borderColor: "var(--ok)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 56,
                lineHeight: 1,
                fontFamily: "var(--hand-2)",
              }}
            >
              🎉
            </div>
            <div
              className="h-display"
              data-testid="celebrate-title"
              style={{ fontSize: 30, marginTop: 6 }}
            >
              收下！
            </div>
            <div
              className="h-body"
              style={{
                fontFamily: "var(--hand-2)",
                fontSize: 17,
                marginTop: 4,
              }}
            >
              你今天搞定了{" "}
              <b style={{ color: "var(--ok)" }}>{doneTodayCount} 件</b> 啦
            </div>

            {/* streak bump */}
            <div
              className="hf-box"
              style={{
                marginTop: 14,
                padding: "8px 12px",
                background: "var(--paper)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>🔥</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="h-meta">连胜</div>
                <div
                  className="h-row"
                  style={{ fontSize: 18, fontFamily: "var(--hand-2)" }}
                >
                  {prevStreak > 0 ? `${prevStreak} → ` : ""}
                  <b style={{ color: "var(--poke)" }}>{currentStreak} 天</b>
                </div>
              </div>
              <span
                className="hf-chip"
                style={{
                  borderColor: "var(--ok)",
                  color: "var(--ok)",
                  gap: 3,
                }}
              >
                <HF.Icon name="shield" size={11} /> ×{shieldCards}
              </span>
            </div>

            {/* sticker reward */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <div className="h-meta">解锁贴纸</div>
              <div
                className="hf-box thick"
                style={{
                  width: 52,
                  height: 52,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--paper)",
                  transform: "rotate(-6deg)",
                  fontSize: 30,
                }}
              >
                🍞
              </div>
              <div
                className="h-meta"
                style={{ fontFamily: "var(--hand-2)" }}
              >
                早餐打卡 ×{doneTodayCount}
              </div>
            </div>

            {/* sound hint */}
            <div
              className="h-meta"
              style={{ marginTop: 10, fontStyle: "italic" }}
            >
              ♪ ding~ · 朋友们也会看到
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 14,
                justifyContent: "center",
              }}
            >
              <Link
                href={shareHref}
                data-testid="celebrate-share"
                className="hf-btn primary"
                style={{ padding: "8px 18px", fontSize: 15 }}
              >
                分享给群
              </Link>
              <Link
                href={closeHref}
                data-testid="celebrate-close"
                className="hf-btn ghost"
                style={{ padding: "8px 14px", fontSize: 15 }}
              >
                关闭
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}
