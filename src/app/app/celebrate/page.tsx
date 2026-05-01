import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getStreakStatus } from "@/services/streaks";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

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

/**
 * Full-screen celebration that shows after a meaningful completion.
 * Mirrors HfL2Celebrate (design/project/hf-screens-L2.jsx lines 37-116).
 *
 * Routed as: /app/celebrate?prev=<streak before bump>
 */
export default async function CelebratePage({
  searchParams,
}: {
  searchParams: Promise<{ prev?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const sp = await searchParams;
  const prevStreak = Number(sp.prev ?? 0) || 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [doneToday, streak] = await Promise.all([
    prisma.completion.count({
      where: { userId: principal.id, completedAt: { gte: todayStart } },
    }),
    getStreakStatus(principal),
  ]);

  return (
    <div
      data-testid="celebrate-page"
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "rgba(40,28,20,0.40)" }}
    >
      {/* sparkle scatter */}
      {SPARKLES.map(([x, y, r, sz], i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: x,
            top: y,
            transform: `rotate(${r}deg)`,
            opacity: 0.7,
            color: "var(--rt-poke)",
          }}
        >
          <Icon name="sparkle" size={sz} />
        </span>
      ))}

      <div
        className="absolute left-5 right-5 max-w-md mx-auto"
        style={{ top: "50%", transform: "translateY(-55%)" }}
      >
        <div
          className="rt-box rt-box-thick rt-tilt-l rt-poke-arrival px-4 pt-5 pb-4.5 text-center"
          style={{
            background: "var(--rt-ok-soft)",
            borderColor: "var(--rt-ok)",
          }}
        >
          <p
            className="leading-none"
            style={{
              fontSize: 56,
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
            }}
          >
            🎉
          </p>
          <h1
            className="rt-h-display mt-1.5"
            data-testid="celebrate-title"
            style={{ fontSize: 30 }}
          >
            收下！
          </h1>
          <p
            className="rt-h-body mt-1"
            style={{
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
              fontSize: 17,
            }}
          >
            你今天搞定了{" "}
            <b style={{ color: "var(--rt-ok)" }}>{doneToday} 件</b> 啦
          </p>

          {/* streak bump */}
          <div
            className="rt-box mt-3.5 px-3 py-2 flex items-center gap-2.5"
            style={{ background: "var(--rt-paper)" }}
          >
            <span style={{ fontSize: 22 }}>🔥</span>
            <div className="flex-1 text-left">
              <p className="rt-h-meta">连胜</p>
              <p
                className="rt-h-row"
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-kalam), Kalam, sans-serif",
                }}
              >
                {prevStreak > 0 && `${prevStreak} → `}
                <b style={{ color: "var(--rt-poke)" }}>
                  {streak.current} 天
                </b>
              </p>
            </div>
            <span
              className="rt-chip"
              style={{
                borderColor: "var(--rt-ok)",
                color: "var(--rt-ok)",
                gap: 3,
              }}
            >
              <Icon name="shield" size={11} /> ×{streak.shieldCards}
            </span>
          </div>

          <p
            className="rt-h-meta italic mt-2.5"
            style={{ fontStyle: "italic" }}
          >
            ♪ ding~ · 朋友们也会看到
          </p>

          <div className="flex gap-1.5 mt-3.5 justify-center">
            <Link
              href="/app"
              data-testid="celebrate-share"
              className="rt-btn rt-btn-primary"
              style={{ padding: "8px 18px", fontSize: 15 }}
            >
              分享给群
            </Link>
            <Link
              href="/app"
              data-testid="celebrate-close"
              className="rt-btn rt-btn-ghost"
              style={{ padding: "8px 14px", fontSize: 15 }}
            >
              关闭
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
