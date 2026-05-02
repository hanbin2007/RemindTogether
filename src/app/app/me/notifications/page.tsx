import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  listActivity,
  countUnread,
  type ActivityItem,
} from "@/services/activity";
import { PageShell } from "@/components/hf";
import {
  HfL2Notif,
  type HfNotifFilter,
  type HfNotifItem,
  type HfNotifKind,
} from "@/components/hf/screens/HfL2Notif";
import { markAllReadAction } from "./actions";

export const dynamic = "force-dynamic";

const VALID_FILTERS: readonly HfNotifFilter[] = [
  "all",
  "unread",
  "today",
  "poke",
] as const;

function timeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

/** ActivityItem.kind is a superset of HfNotifKind (legacy values map
 *  cleanly). We keep the same string union so the cast is safe. */
function toNotifItem(it: ActivityItem): HfNotifItem {
  return {
    id: it.id,
    kind: it.kind as HfNotifKind,
    who: it.who,
    group: it.group,
    title: it.title,
    sub: it.sub,
    time: timeAgo(it.createdAt),
    href: it.href,
    createdAt: it.createdAt,
    readAt: it.readAt,
  };
}

export default async function NotificationsPage({
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
  const requested = (sp.filter ?? "all") as HfNotifFilter;
  const activeFilter: HfNotifFilter = VALID_FILTERS.includes(requested)
    ? requested
    : "all";

  const [allItems, unread] = await Promise.all([
    listActivity(principal, { limit: 50 }),
    countUnread(principal),
  ]);

  // Apply client-side filter (small list — server-side filtering is a
  // future optimization).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const filtered = allItems.filter((it) => {
    if (activeFilter === "unread") return it.readAt === null;
    if (activeFilter === "today")
      return it.createdAt.getTime() >= todayStart.getTime();
    if (activeFilter === "poke") return it.kind === "POKE_RECEIVED";
    return true;
  });

  const items = filtered.map(toNotifItem);

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={4}>
      <HfL2Notif
        items={items}
        unreadCount={unread}
        activeFilter={activeFilter}
        backHref="/app/me"
        markAllSlot={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <button
                type="submit"
                data-testid="inbox-mark-all"
                className="h-meta"
                style={{
                  color: "var(--claim)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                全部已读 ({unread})
              </button>
            </form>
          ) : undefined
        }
      />
    </PageShell>
  );
}
