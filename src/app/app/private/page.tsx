import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listReminders } from "@/services/reminders";
import { listMyGroups } from "@/services/groups";
import { PageShell } from "@/components/hf";
import {
  HfPrivate,
  type HfPrivateGroup,
  type HfPrivateItem,
} from "@/components/hf/screens/HfPrivate";
import { QuickAdd } from "../(home)/quick-add";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "today", "week", "none"] as const;
type FilterKey = (typeof FILTERS)[number];

function timeOfDay(iso: Date): string {
  return `${String(iso.getHours()).padStart(2, "0")}:${String(iso.getMinutes()).padStart(2, "0")}`;
}

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
  const requested = (sp.filter ?? "all") as FilterKey;
  const filter: FilterKey = (FILTERS as readonly string[]).includes(requested)
    ? requested
    : "all";

  const [reminders, groups] = await Promise.all([
    listReminders(principal, "private"),
    listMyGroups(principal),
  ]);
  // Pre-fetched so long-press flows can be wired later (kept here so the
  // server fetch shape matches the existing page).
  void groups;

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

  // Bucket by tag (or "未分类" bucket).
  const buckets = new Map<string, HfPrivateGroup>();
  for (const r of filtered) {
    const tag = r.tags[0]?.tag;
    const key = tag?.id ?? "_none_";
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        name: tag?.name ?? "未分类",
        color: tag?.color ?? null,
        count: 0,
        items: [],
      });
    }
    const subBits: string[] = [];
    if (r.dueAt) subBits.push(timeOfDay(new Date(r.dueAt)));
    subBits.push("私人");
    const item: HfPrivateItem = {
      id: r.id,
      title: r.title,
      sub: subBits.join(" · "),
      done: r.status === "DONE",
    };
    const bucket = buckets.get(key)!;
    bucket.items.push(item);
    bucket.count = bucket.items.length;
  }

  const groupBuckets = Array.from(buckets.values());

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={3}>
      <HfPrivate
        activeFilter={filter}
        groups={groupBuckets}
        hintCard
        topSlot={<QuickAdd />}
        emptyFallback={
          <p
            data-testid="private-empty"
            className="h-body"
            style={{ color: "var(--ink-mute)", padding: "32px 0" }}
          >
            这里还空着 — 想到什么记一下。
          </p>
        }
      />
    </PageShell>
  );
}
