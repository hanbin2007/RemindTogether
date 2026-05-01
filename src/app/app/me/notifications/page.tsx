import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listInbox } from "@/services/pokes";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

const TONE_TEXT: Record<"ALMOST" | "THINKING" | "NO_RUSH", string> = {
  ALMOST: "差一点点",
  THINKING: "想到你了",
  NO_RUSH: "不急慢慢来",
};

function timeAgo(iso: Date): string {
  const ms = Date.now() - iso.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
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
  const inbox = await listInbox(principal, { limit: 50 });

  return (
    <AppShell
      meta="朋友想到你的瞬间"
      greeting="收到的拍拍"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <Link
        href="/app/me"
        className="rt-h-meta inline-flex items-center gap-1 mb-3"
      >
        ‹ 我
      </Link>

      {inbox.length === 0 ? (
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
          {inbox.map((p, i) => (
            <li
              key={p.id}
              data-testid={`inbox-row-${p.id}`}
              data-unread={p.readAt ? "false" : "true"}
              className="rt-row rt-poke-arrival"
              style={{
                animationDelay: `${Math.min(i * 60, 240)}ms`,
                borderBottom:
                  i === inbox.length - 1 ? "none" : undefined,
                opacity: p.readAt ? 0.7 : 1,
              }}
            >
              <Avatar
                name={p.from.displayName}
                i={avatarSlot(p.from.id)}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="rt-h-row" style={{ fontSize: 15 }}>
                    {p.from.displayName}
                  </p>
                  <span
                    className="rt-chip"
                    style={{
                      fontSize: 11,
                      padding: "1px 7px",
                      background: "var(--rt-poke-soft)",
                      color: "var(--rt-poke)",
                      borderColor: "var(--rt-poke)",
                    }}
                  >
                    {TONE_TEXT[p.tone as keyof typeof TONE_TEXT]}
                  </span>
                  <span className="rt-h-meta ml-auto">
                    {timeAgo(new Date(p.sentAt))}
                  </span>
                </div>
                {p.message && (
                  <p
                    className="rt-h-body mt-1"
                    style={{ fontSize: 14 }}
                  >
                    {p.message}
                  </p>
                )}
                <Link
                  href={`/app/poke/${p.id}`}
                  data-testid={`inbox-row-${p.id}-open`}
                  className="rt-h-meta mt-1 inline-block"
                  style={{ color: "var(--rt-claim)" }}
                >
                  打开 →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
