import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listActivity, countUnread, type ActivityItem } from "@/services/activity";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon, type IconName } from "@/components/sketch/icon";
import { markAllReadAction } from "./actions";

export const dynamic = "force-dynamic";

interface IconCfg {
  ic: IconName;
  color: string;
  bg: string;
}

const KIND_CFG: Record<ActivityItem["kind"], IconCfg> = {
  POKE_RECEIVED: { ic: "wave", color: "var(--rt-poke)", bg: "var(--rt-poke-soft)" },
  REMINDER_CLAIMED_BY_OTHER: {
    ic: "handshake",
    color: "var(--rt-claim)",
    bg: "var(--rt-claim-soft)",
  },
  REMINDER_COMPLETED_BY_OTHER: {
    ic: "check",
    color: "var(--rt-done)",
    bg: "var(--rt-done-soft)",
  },
  COMMENT_NEW: {
    ic: "chat",
    color: "var(--rt-claim)",
    bg: "var(--rt-claim-soft)",
  },
  REACTION_NEW: {
    ic: "heart",
    color: "var(--rt-poke)",
    bg: "var(--rt-poke-soft)",
  },
  GROUP_INVITED: { ic: "users", color: "var(--rt-ink)", bg: "var(--rt-paper-2)" },
  STREAK_MILESTONE: {
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

function avSeed(item: ActivityItem): string {
  // Stable color slot per "actor" so the same person looks the same.
  // Falls back to the item id for system entries (streak milestone).
  return item.who ?? item.id;
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const [items, unread] = await Promise.all([
    listActivity(principal, { limit: 50 }),
    countUnread(principal),
  ]);

  return (
    <AppShell
      meta="朋友想到你的瞬间"
      greeting="收到的拍拍"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <div className="flex items-center mb-3">
        <Link
          href="/app/me"
          className="rt-h-meta inline-flex items-center gap-1"
        >
          ‹ 我
        </Link>
        {unread > 0 && (
          <form action={markAllReadAction} className="ml-auto">
            <button
              type="submit"
              data-testid="inbox-mark-all"
              className="rt-h-meta hover:text-rt-ink"
              style={{ color: "var(--rt-claim)" }}
            >
              全部已读 ({unread})
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <div
            className="rt-box rt-box-thick rt-tilt-l mx-auto flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              background: "var(--rt-paper-2)",
            }}
          >
            <Icon name="inbox" size={40} color="var(--rt-ink-mute)" />
          </div>
          <p
            data-testid="inbox-empty"
            className="rt-h-body mt-4 italic text-rt-ink-mute"
          >
            收件箱空着 — 慢慢来。
          </p>
        </div>
      ) : (
        <ul className="rt-box px-3" data-testid="inbox-list">
          {items.map((item, i) => {
            const cfg = KIND_CFG[item.kind];
            const isUnread = item.readAt === null;
            const Wrapper = item.href
              ? ({ children }: { children: React.ReactNode }) => (
                  <Link
                    href={item.href!}
                    className="flex-1 min-w-0 block"
                    data-testid={`inbox-row-${item.id}-link`}
                  >
                    {children}
                  </Link>
                )
              : ({ children }: { children: React.ReactNode }) => (
                  <div className="flex-1 min-w-0">{children}</div>
                );
            return (
              <li
                key={item.id}
                data-testid={`inbox-row-${item.id}`}
                data-kind={item.kind}
                data-unread={isUnread ? "true" : "false"}
                className="rt-row rt-poke-arrival"
                style={{
                  animationDelay: `${Math.min(i * 60, 240)}ms`,
                  borderBottom: i === items.length - 1 ? "none" : undefined,
                  opacity: isUnread ? 1 : 0.7,
                }}
              >
                {item.who ? (
                  <Avatar
                    name={item.who}
                    i={avatarSlot(avSeed(item))}
                    size={32}
                  />
                ) : (
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
                )}
                <Wrapper>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="rt-h-row" style={{ fontSize: 15 }}>
                      {item.who && <b>{item.who} </b>}
                      <span
                        style={{
                          color: "var(--rt-ink-soft)",
                          fontWeight: 400,
                        }}
                      >
                        {item.title}
                      </span>
                    </p>
                    {item.group && (
                      <span
                        className="rt-h-meta"
                        style={{ color: cfg.color }}
                      >
                        #{item.group}
                      </span>
                    )}
                    <span className="rt-h-meta ml-auto">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  {item.sub && (
                    <p
                      className="rt-h-body mt-0.5"
                      style={{ fontSize: 13 }}
                    >
                      {item.sub}
                    </p>
                  )}
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
