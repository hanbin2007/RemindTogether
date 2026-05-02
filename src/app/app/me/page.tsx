/**
 * Server-side data fetch + thin wrapper around `<HfProfile />`. The
 * visual port lives in `components/hf/screens/HfProfile.tsx`; this
 * page shapes data and plugs the client-component slots (PushOptIn,
 * logout form). Wrapped in <PageShell tabActive={4}> so the bottom
 * 5-tab nav renders on "我" (the design has TabBar active={4}).
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { logoutAction } from "@/app/auth/login/actions";
import { getStreakStatus } from "@/services/streaks";
import { listActivity } from "@/services/activity";
import { getHeatmap } from "@/services/heatmap";
import { prisma } from "@/lib/prisma";
import { avatarSlot } from "@/components/sketch/avatar";
import { PageShell } from "@/components/hf";
import { PushOptIn } from "@/components/push-opt-in";
import {
  HfProfile,
  type HfProfileNotifItem,
  type HfProfileNotifKind,
  type HfProfileQuickLink,
} from "@/components/hf/screens/HfProfile";

export const dynamic = "force-dynamic";

function timeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

const QUICK: HfProfileQuickLink[] = [
  { ic: "moon", l: "勿扰", sub: "时段 / 周末", href: "/app/me/settings/notif" },
  { ic: "wave", l: "允许被拍拍", sub: "勿扰时关闭", href: "/app/me/settings/notif" },
  { ic: "bell", l: "通知声", sub: "选个音色", href: "/app/me/settings/notif" },
  { ic: "trendDown", l: "我的小赢", sub: "查看完成历史", href: "/app/me/wins" },
];

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
  const weekEnd = new Date();
  weekEnd.setHours(23, 59, 59, 999);

  const [
    streak,
    user,
    activity,
    heatmap,
    pokesGiven,
    pokesReceived,
    weekStreakDays,
  ] = await Promise.all([
    getStreakStatus(principal),
    prisma.user.findUnique({
      where: { id: principal.id },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
    }),
    listActivity(principal, { limit: 5 }),
    getHeatmap(principal, { days: 14 }),
    prisma.poke.count({
      where: { fromId: principal.id, sentAt: { gte: weekStart } },
    }),
    prisma.poke.count({
      where: { toId: principal.id, sentAt: { gte: weekStart } },
    }),
    prisma.streakDay.findMany({
      where: { userId: principal.id, date: { gte: weekStart } },
    }),
  ]);

  const daysSinceJoin = user
    ? Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000)
    : 0;
  const completionRate = (() => {
    if (weekStreakDays.length === 0) return 0;
    const ok = weekStreakDays.filter(
      (d) => d.status === "DONE" || d.status === "PROTECTED",
    ).length;
    return Math.round((ok / weekStreakDays.length) * 100);
  })();
  const handle = (user?.email ?? "").split("@")[0];

  // Pivot the heatmap (day-major from service) into row-major (slot, day)
  // so the design's grid (gridTemplateColumns: repeat(14, 1fr)) renders
  // as 4 rows × 14 columns.
  const heatmapGrid = (() => {
    const out: number[] = new Array(14 * 4).fill(0);
    const dateOrder = Array.from(new Set(heatmap.cells.map((c) => c.date)));
    for (const c of heatmap.cells) {
      const dayIdx = dateOrder.indexOf(c.date);
      if (dayIdx >= 0 && dayIdx < 14) {
        out[c.slot * 14 + dayIdx] = c.intensity;
      }
    }
    return out;
  })();

  const weekRange = (() => {
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${fmt(weekStart)} — ${fmt(weekEnd)}`;
  })();

  const notifications: HfProfileNotifItem[] = activity.map((it) => ({
    id: it.id,
    kind: it.kind as HfProfileNotifKind,
    who: it.who,
    group: it.group,
    title: it.title,
    sub: it.sub,
    time: timeAgo(it.createdAt),
    href: it.href,
  }));

  return (
    <PageShell isAdmin={principal.isAdmin} tabActive={4}>
      <HfProfile
        user={{
          id: principal.id,
          displayName: user?.displayName ?? "你",
          slot: avatarSlot(principal.id),
        }}
        handle={handle}
        daysSinceJoin={daysSinceJoin}
        weekRange={weekRange}
        stats={{
          completionRate,
          streakDays: streak.current,
          pokesGiven,
          pokesReceived,
        }}
        heatmapGrid={heatmapGrid}
        notifications={notifications}
        quickLinks={QUICK}
        settingsHref="/app/me/settings"
        notifHref="/app/me/notifications"
        tagsHref="/app/me/tags"
        pushOptInSlot={
          <PushOptIn
            vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
          />
        }
        logoutFormSlot={
          <form action={logoutAction}>
            <button
              type="submit"
              data-testid="logout-button"
              className="hf-btn ghost"
              style={{
                padding: "8px 14px",
                fontSize: 14,
                color: "var(--poke)",
              }}
            >
              退出登录
            </button>
          </form>
        }
      />
    </PageShell>
  );
}
