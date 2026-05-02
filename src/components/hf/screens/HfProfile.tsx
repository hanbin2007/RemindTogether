/**
 * 1:1 port of `window.HfProfile` (design/project/hf-screens-B.jsx
 * lines 435-506) plus the inline `Stat` (lines 508-515) and `Notif`
 * (lines 517-544) helpers. Pure presentational; the server page in
 * `/app/me/page.tsx` shapes data and passes it as typed props.
 *
 * Mechanical replacements:
 *   - <Phone> + <TabBar> wrappers       → page chrome (PageShell renders
 *     the global tabbar, no bezel)
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - <Av ...>                           → <HF.Av ... />
 *   - hardcoded 4 stats / 14×4 dots      → typed props
 *   - hardcoded notif rows                → `notifications` prop
 *   - hardcoded "@xiachuan · 入伙 184 天" → typed handle + daysSinceJoin
 *   - hardcoded 4 quick-setting cards     → `quickLinks` prop
 *   - PushOptIn / logout form / tags card → render slots
 *
 * className + inline styles + structure preserved byte-for-byte.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { HF, type IconName } from "@/components/sketch/hf";
import type { HfNotifKind } from "./HfL2NotifList";

export type HfProfileNotifKind = HfNotifKind;

export interface HfProfileNotifItem {
  id: string;
  kind: HfProfileNotifKind;
  who: string | null;
  group: string | null;
  title: string;
  sub: string | null;
  /** Pre-formatted relative time, e.g. "2 分前". */
  time: string;
  href: string | null;
}

export interface HfProfileQuickLink {
  ic: IconName;
  l: string;
  sub: string;
  href: string;
}

export interface HfProfileStats {
  completionRate: number;
  streakDays: number;
  pokesGiven: number;
  pokesReceived: number;
}

export interface HfProfileProps {
  /** Current user. `slot` is the 0..6 avatar palette index. */
  user: { id: string; displayName: string; slot: number };
  /** "@handle" (already without the @). */
  handle: string;
  daysSinceJoin: number;
  /** Energy-card week range, pre-formatted "4/24 — 4/30". */
  weekRange: string;
  stats: HfProfileStats;
  /** 14×4 = 56 cells, intensity 0-4 each. Layout is row-major (slot, day). */
  heatmapGrid: number[];
  notifications: HfProfileNotifItem[];
  quickLinks: HfProfileQuickLink[];
  /** href for the gear icon (settings home). */
  settingsHref: string;
  /** href for "全部 ›" beside notifications. */
  notifHref: string;
  /** href for the standalone "标签" card. */
  tagsHref: string;
  /** PushOptIn client component. */
  pushOptInSlot: ReactNode;
  /** Logout form (server action). */
  logoutFormSlot: ReactNode;
}

interface NotifCfg {
  ic: IconName;
  c: string;
  bg: string;
}

/**
 * Direct port of the design's `Notif` cfg map (lines 518-524). Maps
 * every supported notif kind back to one of the 5 design types.
 */
const NOTIF_CFG: Record<HfProfileNotifKind, NotifCfg> = {
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

/** Direct port of the design's `Stat` helper (lines 508-515). */
function Stat({ v, l, big = false }: { v: string; l: string; big?: boolean }) {
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

/** Direct port of the design's `Notif` helper (lines 525-543). */
function Notif({
  item,
  last,
}: {
  item: HfProfileNotifItem;
  last: boolean;
}) {
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
        {item.time}
      </div>
    </div>
  );
}

export function HfProfile({
  user,
  handle,
  daysSinceJoin,
  weekRange,
  stats,
  heatmapGrid,
  notifications,
  quickLinks,
  settingsHref,
  notifHref,
  tagsHref,
  pushOptInSlot,
  logoutFormSlot,
}: HfProfileProps) {
  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        width: "100%",
        maxWidth: "var(--app-max-w)",
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
        <HF.Av name={user.displayName} i={user.slot} size={56} />
        <div style={{ flex: 1 }}>
          <div className="h-h1">{user.displayName}</div>
          <div className="h-meta">
            @{handle} · 入伙 {daysSinceJoin} 天
          </div>
        </div>
        <Link
          href={settingsHref}
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
            <Stat v={`${stats.completionRate}%`} l="完成率" big />
            <Stat v={`${stats.streakDays} 天`} l="连胜" />
            <Stat v={`${stats.pokesGiven}`} l="拍朋友" />
            <Stat v={`${stats.pokesReceived}`} l="被想起" />
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
            href={notifHref}
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
          {notifications.length === 0 ? (
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
            notifications.map((n, i) => (
              <Notif
                key={n.id}
                item={n}
                last={i === notifications.length - 1}
              />
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
          {quickLinks.map((s) => (
            <Link
              key={s.l}
              href={s.href}
              className="hf-box"
              style={{ padding: 10 }}
              data-testid={`me-quick-${s.ic}`}
            >
              <div
                style={{
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                }}
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
          href={tagsHref}
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
          {pushOptInSlot}
        </div>

        <div style={{ marginTop: 16 }}>{logoutFormSlot}</div>
      </div>
    </div>
  );
}
