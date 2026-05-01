import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listReminders } from "@/services/reminders";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";
import { TodayList } from "../(home)/today-list";
import { QuickAdd } from "../(home)/quick-add";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "week", label: "本周" },
  { key: "none", label: "没期限" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function PrivateRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
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
  const filter = (sp.filter ?? "all") as FilterKey;

  const reminders = await listReminders(principal, "private");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const filtered = reminders.filter((r) => {
    if (filter === "all") return true;
    if (filter === "none") return !r.dueAt;
    if (!r.dueAt) return false;
    const d = new Date(r.dueAt);
    if (filter === "today") return d >= todayStart && d < todayEnd;
    if (filter === "week") return d >= todayStart && d < weekEnd;
    return true;
  });

  // Group by tag (or "未分类" bucket).
  type Bucket = {
    name: string;
    color: string | null;
    items: typeof filtered;
  };
  const buckets = new Map<string, Bucket>();
  for (const r of filtered) {
    const tag = r.tags[0]?.tag;
    const key = tag?.id ?? "_none_";
    if (!buckets.has(key)) {
      buckets.set(key, {
        name: tag?.name ?? "未分类",
        color: tag?.color ?? null,
        items: [],
      });
    }
    buckets.get(key)!.items.push(r);
  }

  return (
    <AppShell
      meta={
        <span className="inline-flex items-center gap-1">
          <Icon name="lock" size={12} /> 只有你能看见
        </span>
      }
      greeting="私人"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="private"
      trailing={
        <Link
          href="/app/reminders/new"
          data-testid="private-new"
          className="rt-btn rt-btn-primary"
          style={{ padding: "6px 10px", fontSize: 13 }}
        >
          <Icon name="plus" size={12} /> 加
        </Link>
      }
    >
      <div className="flex gap-1.5 mb-4" data-testid="private-filters">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/app/private" : `/app/private?filter=${f.key}`}
            data-testid={`private-filter-${f.key}`}
            data-active={filter === f.key ? "true" : undefined}
            className={`rt-chip flex-1 justify-center ${filter === f.key ? "rt-chip-fill" : ""}`}
            style={{ fontSize: 13 }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div id="quick-add" className="mb-5">
        <QuickAdd />
      </div>

      {buckets.size === 0 ? (
        <p
          data-testid="private-empty"
          className="rt-h-body text-rt-ink-mute py-8"
        >
          这里还空着 — 想到什么记一下。
        </p>
      ) : (
        <>
          {Array.from(buckets.entries()).map(([key, b], idx) => (
            <div key={key} className="mt-2">
              <div className="flex items-center gap-2 mt-4 mb-1.5">
                <span
                  className="inline-block"
                  style={{
                    width: 12,
                    height: 12,
                    background: b.color ?? "var(--rt-ink)",
                    borderRadius: 3,
                    transform: `rotate(${idx % 2 === 0 ? 8 : -6}deg)`,
                  }}
                />
                <h2 className="rt-h-h2">{b.name}</h2>
                <span className="rt-h-meta ml-auto">{b.items.length} 件</span>
              </div>
              <div className="rt-box px-3.5">
                <TodayList
                  reminders={b.items.map((r) => ({
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    status: r.status,
                    visibility: r.visibility,
                    group: null,
                    dueAt: r.dueAt?.toISOString() ?? null,
                  }))}
                  compact
                  emptyHint=""
                />
              </div>
            </div>
          ))}

          <div
            className="rt-box rt-box-dashed rt-box-dim rt-tilt-r mt-5 p-3 flex gap-2.5 items-start"
            data-testid="private-hint"
          >
            <span className="inline-flex flex-shrink-0 rt-text-claim">
              <Icon name="handshake" size={22} />
            </span>
            <div className="flex-1">
              <p className="rt-h-row">
                这件事可以 <span className="rt-hl">让别人帮你记</span>
              </p>
              <p className="rt-h-body" style={{ fontSize: 13 }}>
                长按一项 → 分享到群组 / @ 朋友
              </p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
