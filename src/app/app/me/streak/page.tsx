import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getStreakStatus } from "@/services/streaks";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

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

/**
 * Big streak celebration page — mirrors HfL2StreakBig.
 * - For 7+ day streaks: full celebration with trophy + 7-day grid
 * - Otherwise: encouraging "还差 N 天" framing with the recent day grid
 */
export default async function StreakPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const streak = await getStreakStatus(principal);

  const reachedWeek = streak.current >= 7;
  const nextMilestone = reachedWeek ? 30 : 7;
  const remaining = nextMilestone - streak.current;
  const milestoneTitle = reachedWeek ? "30 天 — 一个月连胜" : "7 天 — 一周连胜";

  const last7 = streak.recent.slice(-7);

  return (
    <div
      data-testid="streak-page"
      className="min-h-screen relative overflow-hidden"
      style={{
        background: reachedWeek
          ? "linear-gradient(180deg, var(--rt-poke-soft) 0%, var(--rt-paper) 60%)"
          : "var(--rt-paper)",
      }}
    >
      {reachedWeek &&
        SPARKLES.map(([x, y, r, sz], i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: x,
              top: y,
              transform: `rotate(${r}deg)`,
              color: "var(--rt-poke)",
              opacity: 0.7,
            }}
          >
            <Icon name="sparkle" size={sz} />
          </span>
        ))}

      <div className="px-5 pt-15 text-center max-w-md mx-auto relative pb-8">
        <Link
          href="/app/me"
          data-testid="streak-back"
          className="rt-h-meta inline-flex items-center gap-1 absolute top-5 left-5"
        >
          ‹ 我
        </Link>

        <p
          className="rt-h-meta"
          style={{
            color: "var(--rt-poke)",
            letterSpacing: 2,
            fontSize: 13,
          }}
        >
          ★ {streak.current} 天 ★
        </p>
        <h1
          className="rt-h-display mt-1.5"
          style={{ fontSize: reachedWeek ? 48 : 40, lineHeight: 1.05 }}
          data-testid="streak-title"
        >
          {reachedWeek ? "一周连胜！" : `连胜 ${streak.current} 天`}
        </h1>
        <p
          className="rt-h-body mt-2"
          style={{
            fontFamily: "var(--font-kalam), Kalam, sans-serif",
            fontSize: 17,
          }}
        >
          {reachedWeek
            ? "你坚持了一整周 — 真的不容易"
            : "慢慢来 — 不急，节奏由你"}
        </p>

        {/* trophy / icon */}
        <div
          className="rt-box rt-box-thick mx-auto flex items-center justify-center mt-6"
          style={{
            width: 140,
            height: 140,
            background: "var(--rt-paper)",
            transform: "rotate(-3deg)",
            fontSize: 70,
            boxShadow: "4px 6px 0 var(--rt-ink)",
          }}
        >
          {reachedWeek ? "🏆" : "🌱"}
        </div>

        {/* 7-day grid */}
        <div className="flex justify-center gap-1.5 mt-6">
          {WEEKDAYS.map((label, i) => {
            const day = last7[i];
            const filled =
              day?.status === "DONE" || day?.status === "PROTECTED";
            return (
              <div key={label} className="text-center">
                <div
                  className="flex items-center justify-center"
                  data-testid={`streak-7day-${i}`}
                  style={{
                    width: 30,
                    height: 36,
                    border: "1.5px solid var(--rt-ink)",
                    borderRadius: "6px 4px 7px 5px / 5px 7px 4px 6px",
                    background: filled ? "var(--rt-ok)" : "var(--rt-paper)",
                    color: filled ? "white" : "var(--rt-ink-faint)",
                    fontFamily: "var(--font-kalam), Kalam, sans-serif",
                    transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)`,
                  }}
                >
                  {filled ? "✓" : ""}
                </div>
                <p className="rt-h-meta mt-0.5" style={{ fontSize: 10 }}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* recent 30 days strip */}
        <div className="rt-box mt-6 p-3">
          <p className="rt-h-meta text-left">最近 30 天</p>
          <div className="flex flex-wrap gap-1 mt-2 justify-start">
            {streak.recent.length === 0 ? (
              <p className="rt-h-body italic text-rt-ink-mute">
                还没有完整的天 — 开始记一件事吧。
              </p>
            ) : (
              streak.recent.map((d, i) => {
                let cls = "rt-dot";
                if (d.status === "DONE") cls += " rt-dot-l3";
                else if (d.status === "PROTECTED") cls += " rt-dot-shield";
                else if (d.status === "SKIPPED") cls += " rt-dot-l1";
                else if (d.status === "MISSED") cls += " rt-dot-x";
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
                    }}
                  />
                );
              })
            )}
          </div>
          <p className="rt-h-meta mt-2 text-left">
            最长 {streak.longest} 天 · 保护卡 {streak.shieldCards}/
            {streak.shieldCardCap}
          </p>
        </div>

        {/* next milestone */}
        <div
          className="rt-box rt-box-dashed mt-6 p-2.5 text-left"
          style={{ background: "var(--rt-paper)" }}
        >
          <p className="rt-h-meta">下一个里程碑</p>
          <div className="flex items-center gap-2 mt-1">
            <Icon name="moon" size={20} color="var(--rt-claim)" />
            <div className="flex-1">
              <p className="rt-h-row" style={{ fontSize: 14 }}>
                {milestoneTitle}
              </p>
              <p className="rt-h-meta">
                还差 {Math.max(remaining, 0)} 天 · 不急
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5 justify-center">
          <Link
            href="/app"
            data-testid="streak-share"
            className="rt-btn rt-btn-primary"
            style={{ padding: "10px 22px" }}
          >
            分享给小群
          </Link>
          <Link
            href="/app/me"
            data-testid="streak-close"
            className="rt-btn rt-btn-ghost"
            style={{ padding: "10px 18px" }}
          >
            收下
          </Link>
        </div>
      </div>
    </div>
  );
}
