import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { logoutAction } from "@/app/auth/login/actions";
import { getStreakStatus } from "@/services/streaks";
import { listActivity } from "@/services/activity";
import { getHeatmap } from "@/services/heatmap";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon, type IconName } from "@/components/sketch/icon";
import { PushOptIn } from "@/components/push-opt-in";

export const dynamic = "force-dynamic";

const QUICK_SETTINGS: Array<{ ic: IconName; l: string; sub: string; href: string }> = [
  { ic: "moon", l: "勿扰", sub: "23:00 — 7:00", href: "/app/me/dnd" },
  { ic: "wave", l: "允许被拍拍", sub: "可以在通知里改", href: "/app/me/poke-settings" },
  { ic: "bell", l: "通知声", sub: "微信式", href: "/app/me/notifications" },
  { ic: "trendDown", l: "我的小赢", sub: "查看完成历史", href: "/app/me/streak" },
];

interface NotifEntry {
  id: string;
  type: "poke" | "claim" | "done" | "invite" | "streak";
  who: string | null;
  group: string | null;
  title: string;
  sub: string | null;
  time: string;
}

const NOTIF_CFG: Record<
  NotifEntry["type"],
  { ic: IconName; color: string; bg: string }
> = {
  poke: { ic: "wave", color: "var(--rt-poke)", bg: "var(--rt-poke-soft)" },
  claim: {
    ic: "handshake",
    color: "var(--rt-claim)",
    bg: "var(--rt-claim-soft)",
  },
  done: { ic: "check", color: "var(--rt-done)", bg: "var(--rt-done-soft)" },
  invite: { ic: "plus", color: "var(--rt-ink)", bg: "var(--rt-paper-2)" },
  streak: {
    ic: "trendDown",
    color: "var(--rt-ink-soft)",
    bg: "var(--rt-paper-2)",
  },
};

function timeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    streak,
    unreadCount,
    weekDone,
    pokesGiven,
    pokesReceived,
    user,
    weekDays,
    activity,
    heatmap,
  ] = await Promise.all([
    getStreakStatus(principal),
    prisma.poke.count({
      where: { toId: principal.id, readAt: null },
    }),
    prisma.completion.count({
      where: { userId: principal.id, completedAt: { gte: weekStart } },
    }),
    prisma.poke.count({
      where: { fromId: principal.id, sentAt: { gte: weekStart } },
    }),
    prisma.poke.count({
      where: { toId: principal.id, sentAt: { gte: weekStart } },
    }),
    prisma.user.findUnique({
      where: { id: principal.id },
      select: { id: true, displayName: true, createdAt: true, email: true },
    }),
    prisma.streakDay.findMany({
      where: { userId: principal.id, date: { gte: weekStart } },
      orderBy: { date: "asc" },
    }),
    listActivity(principal, { limit: 5 }),
    getHeatmap(principal, { days: 14 }),
  ]);

  const top: NotifEntry[] = activity.map((a) => ({
    id: a.id,
    type: (
      {
        POKE_RECEIVED: "poke",
        REMINDER_CLAIMED_BY_OTHER: "claim",
        REMINDER_COMPLETED_BY_OTHER: "done",
        COMMENT_NEW: "claim", // re-uses the claim icon set
        REACTION_NEW: "done",
        GROUP_INVITED: "invite",
        STREAK_MILESTONE: "streak",
      } as const
    )[a.kind] ?? "streak",
    who: a.who,
    group: a.group,
    title: a.title,
    sub: a.sub,
    time: timeAgo(a.createdAt),
  }));

  const completionRate = (() => {
    if (weekDays.length === 0) return 0;
    const done = weekDays.filter(
      (d) => d.status === "DONE" || d.status === "PROTECTED",
    ).length;
    return Math.round((done / weekDays.length) * 100);
  })();

  const daysSinceJoin = user
    ? Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000)
    : 0;

  // 14×4 heatmap (day × slot) — design wants horizontal=day, vertical=slot.
  // The service returns cells in day-major order; we transpose to flatten
  // into a row-by-row sequence the existing template expects.
  const heatmapGrid: number[] = (() => {
    const days = 14;
    const slots = 4;
    const out: number[] = new Array(days * slots).fill(0);
    for (const c of heatmap.cells) {
      // cells are emitted (day0,slot0..3),(day1,slot0..3),...
      // Find the day index from the first cell's date.
    }
    // Build a date→index map
    const dateOrder = Array.from(
      new Set(heatmap.cells.map((c) => c.date)),
    );
    for (const c of heatmap.cells) {
      const dayIdx = dateOrder.indexOf(c.date);
      if (dayIdx >= 0 && dayIdx < days) {
        // Render row-major: row=slot, col=day.
        out[c.slot * days + dayIdx] = c.intensity;
      }
    }
    return out;
  })();

  const displayName = user?.displayName ?? "你";

  return (
    <AppShell
      meta={null}
      greeting={undefined}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <div className="flex items-center gap-3 mb-3 mt-2">
        <Avatar
          name={displayName}
          i={avatarSlot(principal.id)}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <h1 className="rt-h-h1 truncate">{displayName}</h1>
          <p className="rt-h-meta">
            {session.user.email} · 入伙 {daysSinceJoin} 天
          </p>
        </div>
        <Link
          href="/app/me/settings"
          aria-label="设置"
          className="rt-btn rt-btn-ghost"
          style={{ padding: "6px 10px" }}
        >
          <Icon name="gear" size={16} />
        </Link>
      </div>

      {/* energy card */}
      <div
        className="rt-box rt-box-thick p-3.5"
        style={{
          background: "var(--rt-ink)",
          color: "white",
          borderColor: "var(--rt-ink)",
        }}
        data-testid="energy-card"
      >
        <div className="flex items-baseline">
          <p
            className="rt-h-meta"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            本周能量卡
          </p>
          <p
            className="rt-h-meta ml-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {Math.floor(weekDone / 7)} 天 / 7 天
          </p>
        </div>
        <div className="flex items-end gap-3.5 mt-2">
          <Stat v={`${completionRate}%`} l="完成率" big />
          <Stat v={`${streak.current} 天`} l="连胜" />
          <Stat v={`${pokesGiven}`} l="拍朋友" />
          <Stat v={`${pokesReceived}`} l="被想起" />
        </div>
        <div
          className="grid mt-3"
          style={{ gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}
        >
          {heatmapGrid.map((v, i) => {
            const op = [0.08, 0.18, 0.38, 0.6, 0.9][v] ?? 0.08;
            return (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "4px 3px 5px 3px / 3px 5px 3px 4px",
                  background: `rgba(255,255,255,${op})`,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
            );
          })}
        </div>
        <p
          className="rt-h-meta mt-2"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          横：天 · 纵：早午晚夜
        </p>
      </div>

      {/* recent notifications */}
      <div className="flex items-center mt-5 mb-1.5">
        <h3 className="rt-h-h3">最近</h3>
        <Link
          href="/app/me/notifications"
          className="rt-h-meta ml-auto"
          style={{ color: "var(--rt-claim)" }}
          data-testid="me-notifications"
        >
          {unreadCount > 0 ? `${unreadCount} 未读` : "全部已读"}
        </Link>
      </div>
      <div className="rt-box px-3">
        {top.length === 0 ? (
          <p className="rt-h-body py-3 italic text-rt-ink-mute">
            还没什么动静。
          </p>
        ) : (
          top.map((n, i) => {
            const cfg = NOTIF_CFG[n.type];
            return (
              <div
                key={n.id}
                className="rt-row"
                style={{
                  borderBottom: i === top.length - 1 ? "none" : undefined,
                }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    border: `1.5px solid ${cfg.color}`,
                    background: cfg.bg,
                    color: cfg.color,
                    borderRadius: "8px 5px 9px 4px / 4px 9px 5px 8px",
                  }}
                >
                  <Icon name={cfg.ic} size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="rt-h-row" style={{ fontSize: 14 }}>
                    {n.who && <b>{n.who} </b>}
                    <span style={{ color: "var(--rt-ink-soft)", fontWeight: 400 }}>
                      {n.title}
                    </span>
                    {n.group && (
                      <>
                        {" · "}
                        <span style={{ color: cfg.color }}>#{n.group}</span>
                      </>
                    )}
                  </p>
                  {n.sub && <p className="rt-h-meta">{n.sub}</p>}
                </div>
                <span className="rt-h-meta flex-shrink-0">{n.time}</span>
              </div>
            );
          })
        )}
      </div>

      {/* quick settings grid */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {QUICK_SETTINGS.map((s) => (
          <Link
            key={s.l}
            href={s.href}
            className="rt-box p-2.5"
            data-testid={`me-setting-${s.ic}`}
          >
            <span className="inline-flex">
              <Icon name={s.ic} size={18} />
            </span>
            <p className="rt-h-row mt-0.5" style={{ fontSize: 14 }}>
              {s.l}
            </p>
            <p className="rt-h-meta">{s.sub}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/app/me/tags"
        data-testid="me-tags"
        className="rt-box rt-box-tight rt-rise px-4 py-3 mt-3 flex items-baseline gap-2"
      >
        <span className="rt-h-h3">标签</span>
        <span className="rt-h-meta ml-auto">→</span>
      </Link>

      <div className="mt-5">
        <p className="rt-h-meta mb-2">PUSH · 离线也能收到拍拍</p>
        <PushOptIn
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
        />
      </div>

      <form action={logoutAction} className="mt-5">
        <button
          type="submit"
          data-testid="logout-button"
          className="rt-btn rt-btn-ghost"
          style={{ color: "var(--rt-poke)" }}
        >
          退出登录
        </button>
      </form>
    </AppShell>
  );
}

function Stat({ v, l, big = false }: { v: string; l: string; big?: boolean }) {
  return (
    <div>
      <div
        className="rt-h-display"
        style={{ fontSize: big ? 30 : 18, color: "white" }}
      >
        {v}
      </div>
      <div
        className="rt-h-meta"
        style={{ color: "rgba(255,255,255,0.55)", marginTop: 2 }}
      >
        {l}
      </div>
    </div>
  );
}
