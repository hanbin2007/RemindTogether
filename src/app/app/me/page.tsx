/**
 * Direct port of HfProfile (design/project/hf-screens-B.jsx
 * lines 435-506). Mechanical replacements only:
 *   - <Phone> + <TabBar> wrappers       → page chrome (AppShell already
 *     renders the bottom tabbar globally)
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - <Av ...>                           → <HF.Av ... />
 *   - hardcoded 4 stats / 14×4 dots      → real activity / heatmap
 *   - hardcoded notif rows                → activity feed projection
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { logoutAction } from "@/app/auth/login/actions";
import { getStreakStatus } from "@/services/streaks";
import { listActivity, type ActivityItem } from "@/services/activity";
import { getHeatmap } from "@/services/heatmap";
import { prisma } from "@/lib/prisma";
import { HF, type IconName } from "@/components/sketch/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import { PushOptIn } from "@/components/push-opt-in";

export const dynamic = "force-dynamic";

interface NotifCfg {
  ic: IconName;
  c: string;
  bg: string;
}

// Direct port of the design's `Notif` cfg map (lines 518-524). Maps
// every Phase 10 ActivityItem.kind back to one of the 5 design types.
const NOTIF_CFG: Record<ActivityItem["kind"], NotifCfg> = {
  POKE_RECEIVED: {
    ic: "wave",
    c: "var(--poke)",
    bg: "var(--poke-soft)",
  },
  REMINDER_CLAIMED_BY_OTHER: {
    ic: "handshake",
    c: "var(--claim)",
    bg: "var(--claim-soft)",
  },
  REMINDER_COMPLETED_BY_OTHER: {
    ic: "check",
    c: "var(--done)",
    bg: "var(--done-soft)",
  },
  COMMENT_NEW: {
    ic: "chat",
    c: "var(--claim)",
    bg: "var(--claim-soft)",
  },
  REACTION_NEW: {
    ic: "heart",
    c: "var(--poke)",
    bg: "var(--poke-soft)",
  },
  GROUP_INVITED: {
    ic: "plus",
    c: "var(--ink)",
    bg: "var(--paper-2)",
  },
  STREAK_MILESTONE: {
    ic: "trendDown",
    c: "var(--ink-soft)",
    bg: "var(--paper-2)",
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

interface NotifProps {
  item: ActivityItem;
  last: boolean;
}

/** Direct port of the design's `Notif` helper (lines 525-543). */
function Notif({ item, last }: NotifProps) {
  const cfg = NOTIF_CFG[item.kind];
  return (
    <div
      data-testid={`profile-notif-${item.id}`}
      data-kind={item.kind}
      className="hf-row"
      style={{
        borderBottom: last ? "none" : "1.3px dashed var(--ink-faint)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          fontSize: 14,
          borderRadius: "8px 5px 9px 4px / 4px 9px 5px 8px",
          border: `1.5px solid ${cfg.c}`,
          background: cfg.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: cfg.c,
        }}
      >
        <HF.Icon name={cfg.ic} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-row" style={{ fontSize: 14 }}>
          {item.who && <b>{item.who}</b>}{" "}
          <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
            {item.title}
          </span>
          {item.group && (
            <>
              {" · "}
              <span style={{ color: cfg.c }}>#{item.group}</span>
            </>
          )}
        </div>
        {item.sub && <div className="h-meta">{item.sub}</div>}
      </div>
      <div
        className="h-meta"
        style={{ alignSelf: "flex-start", marginTop: 4 }}
      >
        {timeAgo(item.createdAt)}
      </div>
    </div>
  );
}

interface StatProps {
  v: string;
  l: string;
  big?: boolean;
}
/** Direct port of the design's `Stat` helper (lines 508-515). */
function Stat({ v, l, big = false }: StatProps) {
  return (
    <div>
      <div
        className="h-display"
        style={{ fontSize: big ? 30 : 18, color: "white" }}
      >
        {v}
      </div>
      <div
        className="h-meta"
        style={{ color: "rgba(255,255,255,0.55)", marginTop: 2 }}
      >
        {l}
      </div>
    </div>
  );
}

const QUICK: Array<{ ic: IconName; l: string; sub: string; href: string }> = [
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
    weekDone,
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
    prisma.completion.count({
      where: { userId: principal.id, completedAt: { gte: weekStart } },
    }),
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

  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        maxWidth: "36rem",
        margin: "0 auto",
        minHeight: "100vh",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          padding: "14px 18px 4px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <HF.Av
          name={user?.displayName ?? "你"}
          i={avatarSlot(principal.id)}
          size={56}
        />
        <div style={{ flex: 1 }}>
          <div className="h-h1">{user?.displayName ?? "你"}</div>
          <div className="h-meta">
            @{handle} · 入伙 {daysSinceJoin} 天
          </div>
        </div>
        <Link
          href="/app/me/settings"
          aria-label="设置"
          className="hf-btn ghost"
          style={{
            padding: "6px 10px",
            fontSize: 16,
            display: "inline-flex",
            alignItems: "center",
          }}
          data-testid="me-settings"
        >
          <HF.Icon name="gear" size={16} />
        </Link>
      </div>

      <div style={{ flex: 1, padding: "8px 14px 70px" }}>
        {/* energy card */}
        <div
          className="hf-box thick"
          style={{
            padding: 14,
            background: "var(--ink)",
            color: "white",
            borderColor: "var(--ink)",
          }}
          data-testid="energy-card"
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div
              className="h-meta"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              本周能量卡
            </div>
            <div
              className="h-meta"
              style={{
                color: "rgba(255,255,255,0.45)",
                marginLeft: "auto",
              }}
            >
              {weekRange}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 14,
              marginTop: 8,
            }}
          >
            <Stat v={`${completionRate}%`} l="完成率" big />
            <Stat v={`${streak.current} 天`} l="连胜" />
            <Stat v={`${pokesGiven}`} l="拍朋友" />
            <Stat v={`${pokesReceived}`} l="被想起" />
          </div>
          {/* dot heatmap */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(14, 1fr)",
              gap: 4,
              marginTop: 12,
            }}
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
          <div
            className="h-meta"
            style={{ color: "rgba(255,255,255,0.5)", marginTop: 8 }}
          >
            横：天 · 纵：早午晚夜
          </div>
        </div>

        {/* notifications */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <div className="h-h3">最近</div>
          <Link
            href="/app/me/notifications"
            className="h-meta"
            style={{ marginLeft: "auto", color: "var(--claim)" }}
            data-testid="me-notifications"
          >
            全部 ›
          </Link>
        </div>
        <div
          className="hf-box"
          style={{ padding: "4px 12px", marginTop: 6 }}
          data-testid="profile-notif-list"
        >
          {activity.length === 0 ? (
            <div
              className="h-body"
              style={{
                padding: "8px 0",
                color: "var(--ink-mute)",
                fontStyle: "italic",
              }}
            >
              还没什么动静。
            </div>
          ) : (
            activity.map((n, i) => (
              <Notif key={n.id} item={n} last={i === activity.length - 1} />
            ))
          )}
        </div>

        {/* quick settings */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 16,
          }}
        >
          {QUICK.map((s) => (
            <Link
              key={s.l}
              href={s.href}
              className="hf-box"
              style={{ padding: 10 }}
              data-testid={`me-quick-${s.ic}`}
            >
              <div
                style={{ height: 22, display: "flex", alignItems: "center" }}
              >
                <HF.Icon name={s.ic} size={18} />
              </div>
              <div className="h-row" style={{ fontSize: 14, marginTop: 2 }}>
                {s.l}
              </div>
              <div className="h-meta">{s.sub}</div>
            </Link>
          ))}
        </div>

        <Link
          href="/app/me/tags"
          data-testid="me-tags"
          className="hf-box"
          style={{
            display: "block",
            padding: "10px 14px",
            marginTop: 12,
          }}
        >
          <div className="h-row" style={{ fontSize: 14 }}>
            标签
          </div>
          <div className="h-meta">把私人提醒分类</div>
        </Link>

        <div style={{ marginTop: 16 }}>
          <div className="h-meta" style={{ marginBottom: 6 }}>
            离线也能收到拍拍
          </div>
          <PushOptIn
            vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
          />
        </div>

        <form action={logoutAction} style={{ marginTop: 16 }}>
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
      </div>
    </div>
  );
}
