import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getStreakStatus } from "@/services/streaks";
import { AppShell } from "@/components/sketch/app-shell";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  DONE: "var(--rt-done)",
  PROTECTED: "var(--rt-claim)",
  SKIPPED: "var(--rt-ink-faint)",
  MISSED: "var(--rt-poke)",
};

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

  return (
    <AppShell
      greeting={`连胜 ${streak.current} 天`}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-5">
        最长 {streak.longest} 天 · 保护卡 {streak.shieldCards}/
        {streak.shieldCardCap} 张 · 今日{" "}
        {streak.todayStatus === "DONE"
          ? "已完成 ✓"
          : streak.todayStatus === "SKIPPED"
            ? "跳过 (–)"
            : "等待中"}
      </p>

      <div
        className="rt-fade-up rt-box p-4"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-3">
          RECENT · 最近 30 天
        </p>
        <ul
          data-testid="streak-recent"
          className="flex flex-wrap gap-1.5"
        >
          {streak.recent.length === 0 ? (
            <li className="font-[family-name:var(--font-kalam)] text-rt-ink-mute italic">
              还没有完整的天 — 开始记一件事吧。
            </li>
          ) : (
            streak.recent.map((d, i) => (
              <li
                key={d.date}
                data-testid={`streak-day-${d.date}`}
                data-status={d.status}
                title={`${d.date} · ${d.status}`}
                className="rt-rise w-6 h-6 rounded-md border-[1.4px] border-rt-ink"
                style={{
                  background: STATUS_COLOR[d.status] ?? "var(--rt-paper-2)",
                  ["--rt-rise-delay" as never]: `${Math.min(i * 18, 320)}ms`,
                }}
              />
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}
