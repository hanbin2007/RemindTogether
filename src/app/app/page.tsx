import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { listReminders } from "@/services/reminders";
import { listMyGroups } from "@/services/groups";
import { getStreakStatus } from "@/services/streaks";
import { ConfigKey, getConfigBool } from "@/services/config";
import { avatarSlot } from "@/components/sketch/avatar";
import { PageShell } from "@/components/hf";
import {
  HfToday,
  type HfTodayItem,
  type HfTodayPokeAlert,
} from "@/components/hf/screens/HfToday";
import { SketchNotice } from "@/components/sketch/notice";
import { QuickAdd } from "./(home)/quick-add";
import { EmptyState } from "./(home)/empty-state";

export const dynamic = "force-dynamic";

const WEEKDAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function formatDateMeta(d: Date): string {
  return `${WEEKDAY[d.getDay()]} · ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function timeAgo(iso: Date): string {
  const ms = Date.now() - iso.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

function timeOfDay(iso: Date): string {
  return `${String(iso.getHours()).padStart(2, "0")}:${String(iso.getMinutes()).padStart(2, "0")}`;
}

export default async function AppHome() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    reminders,
    streak,
    requireVerify,
    doneToday,
    pokesUnread,
    completedToday,
    myGroups,
  ] = await Promise.all([
    listReminders(principal, "today"),
    getStreakStatus(principal),
    getConfigBool(ConfigKey.RequireEmailVerification),
    prisma.completion.count({
      where: {
        userId: principal.id,
        completedAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.poke.findMany({
      where: { toId: principal.id, readAt: null },
      orderBy: { sentAt: "desc" },
      include: {
        from: { select: { id: true, displayName: true } },
        reminder: {
          select: { id: true, title: true, group: { select: { name: true } } },
        },
      },
      take: 5,
    }),
    prisma.completion.findMany({
      where: {
        userId: principal.id,
        completedAt: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { completedAt: "desc" },
      include: { reminder: { select: { id: true, title: true } } },
      take: 6,
    }),
    listMyGroups(principal),
  ]);

  const friendsCount = new Set(pokesUnread.map((p) => p.from.id)).size;
  const todoCount = reminders.length;
  const showVerifyBanner = requireVerify && !session.user.emailIsVerified;

  // Bucket by hour-of-day in UTC: <18 → morning, ≥18 → evening.
  const morning: HfTodayItem[] = [];
  const evening: HfTodayItem[] = [];
  for (const r of reminders) {
    const hour = r.dueAt ? new Date(r.dueAt).getHours() : 9;
    const sub = (() => {
      const bits: string[] = [];
      if (r.dueAt) bits.push(timeOfDay(new Date(r.dueAt)));
      bits.push(
        r.group ? `#${r.group.name}` : r.visibility === "PRIVATE" ? "私人" : "",
      );
      return bits.filter(Boolean).join(" · ");
    })();
    const item: HfTodayItem = {
      id: r.id,
      title: r.title,
      sub,
      done: r.status === "DONE",
      visibility: r.visibility,
      isPinned: r.isPinned,
      dueAt: r.dueAt?.toISOString() ?? null,
      chipKind:
        r._count.claims > 0
          ? "claim"
          : r._count.pokes > 0
            ? "poke"
            : null,
      chipLabel:
        r._count.claims > 0
          ? `${r._count.claims} 认领`
          : r._count.pokes > 0
            ? `${r._count.pokes}× 拍`
            : undefined,
    };
    if (hour < 18) morning.push(item);
    else evening.push(item);
  }

  // Friend hint for empty state
  let friendHint: { name: string; hintText: string } | null = null;
  if (todoCount === 0 && completedToday.length === 0) {
    const recent = await prisma.completion.findFirst({
      where: {
        completedAt: { gte: new Date(Date.now() - 24 * 3_600_000) },
        userId: { not: principal.id },
        reminder: {
          group: {
            members: { some: { userId: principal.id, leftAt: null } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
      include: {
        user: { select: { displayName: true } },
        reminder: { select: { title: true } },
      },
    });
    if (recent) {
      friendHint = {
        name: recent.user.displayName,
        hintText: `今天搞定了「${recent.reminder.title}」 ✓`,
      };
    }
  }

  // Poke alert — top unread.
  const top = pokesUnread[0] ?? null;
  const pokeAlert: HfTodayPokeAlert | null = top
    ? {
        id: top.id,
        fromName: top.from.displayName,
        message: top.message ?? "想到你了",
        agoText: timeAgo(top.sentAt),
        contextText: top.reminder
          ? `${top.reminder.group?.name ?? "私人"} · 还可以补上`
          : "还可以补上",
        acceptHref: top.reminder?.id ? `/app/reminders/${top.reminder.id}` : null,
      }
    : null;

  const groupsAvailable = myGroups.map((g) => ({
    id: g.id,
    name: g.name,
    coverEmoji: g.coverEmoji ?? null,
  }));

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={0}>
      <HfToday
        meta={formatDateMeta(new Date())}
        user={{
          name: session.user.name ?? "你",
          slot: avatarSlot(session.user.id),
        }}
        groupsAvailable={groupsAvailable}
        friendsThinkingCount={friendsCount}
        doneTodayCount={doneToday}
        todoCount={todoCount}
        streak={{
          days: streak.current,
          shieldCards: streak.shieldCards,
        }}
        pokeAlert={pokeAlert}
        morning={morning}
        evening={evening}
        finished={completedToday.map((c) => ({
          id: c.id,
          title: c.reminder.title,
        }))}
        topSlot={
          <>
            {showVerifyBanner && (
              <div style={{ marginTop: 8 }}>
                <SketchNotice
                  tone="warn"
                  testid="email-not-verified-banner"
                  animate
                >
                  请打开注册邮件里的链接完成验证。
                </SketchNotice>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <QuickAdd />
            </div>
          </>
        }
        emptyFallback={<EmptyState friendHint={friendHint} />}
      />
    </PageShell>
  );
}
