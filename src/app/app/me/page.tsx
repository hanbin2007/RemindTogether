import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { logoutAction } from "@/app/auth/login/actions";
import { getStreakStatus } from "@/services/streaks";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/sketch/app-shell";
import { PushOptIn } from "@/components/push-opt-in";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const [streak, unreadCount] = await Promise.all([
    getStreakStatus(principal),
    prisma.poke.count({
      where: { toId: principal.id, readAt: null },
    }),
  ]);

  return (
    <AppShell
      greeting={session.user.name ?? "你"}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <div
        className="rt-fade-up rt-box p-5 mb-5"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
          STREAK · 连胜
        </p>
        <p className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-3xl leading-none">
          <span className="rt-hl">{streak.current}</span> 天
        </p>
        <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm">
          最长 {streak.longest} 天 · 保护卡 {streak.shieldCards}/
          {streak.shieldCardCap} 张
        </p>
        <Link
          href="/app/me/streak"
          className="rt-squig text-rt-ink text-sm mt-2 inline-block"
        >
          查看完整记录 →
        </Link>
      </div>

      <ul className="space-y-2 mb-6">
        <li>
          <Link
            href="/app/me/notifications"
            data-testid="me-notifications"
            className="rt-rise rt-box-tight bg-rt-paper px-4 py-3 flex items-baseline gap-2"
            style={{
              borderRadius: "10px 6px 11px 5px / 5px 11px 6px 10px",
            }}
          >
            <span className="font-[family-name:var(--font-caveat)] font-semibold text-lg text-rt-ink">
              通知
            </span>
            {unreadCount > 0 && (
              <span
                data-testid="me-unread-count"
                className="rt-box-tight bg-[color:var(--rt-poke-soft)] text-[color:var(--rt-poke)] px-2 py-0.5 text-xs"
                style={{
                  borderRadius: "6px 4px 7px 3px / 3px 7px 4px 6px",
                }}
              >
                {unreadCount} 条未读
              </span>
            )}
            <span className="ml-auto rt-squig text-rt-ink-soft text-sm">
              →
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/app/me/tags"
            data-testid="me-tags"
            className="rt-rise rt-box-tight bg-rt-paper px-4 py-3 flex items-baseline gap-2"
            style={{
              borderRadius: "10px 6px 11px 5px / 5px 11px 6px 10px",
              ["--rt-rise-delay" as never]: "60ms",
            }}
          >
            <span className="font-[family-name:var(--font-caveat)] font-semibold text-lg text-rt-ink">
              标签
            </span>
            <span className="ml-auto rt-squig text-rt-ink-soft text-sm">
              →
            </span>
          </Link>
        </li>
      </ul>

      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-2">
          PUSH · 离线也能收到拍拍
        </p>
        <PushOptIn
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
        />
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          data-testid="logout-button"
          className="rt-btn"
        >
          退出登录
        </button>
      </form>
    </AppShell>
  );
}
