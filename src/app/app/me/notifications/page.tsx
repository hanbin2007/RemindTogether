import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listInbox } from "@/services/pokes";
import { AppShell } from "@/components/sketch/app-shell";
import { markReadAction } from "./actions";

export const dynamic = "force-dynamic";

const TONE_TEXT: Record<"ALMOST" | "THINKING" | "NO_RUSH", string> = {
  ALMOST: "差一点点",
  THINKING: "想到你了",
  NO_RUSH: "不急慢慢来",
};

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
      greeting="收到的拍拍"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-5">
        朋友想到你的瞬间。
      </p>

      {inbox.length === 0 ? (
        <p
          data-testid="inbox-empty"
          className="font-[family-name:var(--font-kalam)] text-rt-ink-mute py-6"
        >
          收件箱空着 — 慢慢来。
        </p>
      ) : (
        <ul className="space-y-3" data-testid="inbox-list">
          {inbox.map((p, i) => (
            <li
              key={p.id}
              data-testid={`inbox-row-${p.id}`}
              data-unread={p.readAt ? "false" : "true"}
              className={`rt-poke-arrival rt-box px-4 py-3 ${
                p.readAt ? "bg-rt-paper-2 opacity-80" : "bg-rt-paper"
              }`}
              style={{
                borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px",
                animationDelay: `${Math.min(i * 60, 240)}ms`,
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-xl">
                  {p.from.displayName}
                </span>
                <span
                  className="rt-box-tight bg-[color:var(--rt-poke-soft)] text-[color:var(--rt-poke)] px-2 py-0.5 text-xs"
                  style={{
                    borderRadius: "6px 4px 7px 3px / 3px 7px 4px 6px",
                  }}
                >
                  {TONE_TEXT[p.tone as keyof typeof TONE_TEXT]}
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {new Date(p.sentAt).toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </div>
              {p.message && (
                <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-[15px] leading-snug">
                  {p.message}
                </p>
              )}
              {!p.readAt && (
                <form action={markReadAction} className="mt-2">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    data-testid={`inbox-row-${p.id}-mark-read`}
                    className="rt-btn"
                  >
                    标记已读
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
