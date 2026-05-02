import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { listReminders } from "@/services/reminders";
import { getStreakStatus } from "@/services/streaks";
import { ConfigKey, getConfigBool } from "@/services/config";
import { AppShell } from "@/components/sketch/app-shell";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";
import { SketchNotice } from "@/components/sketch/notice";
import { TodayList } from "./(home)/today-list";
import { QuickAdd } from "./(home)/quick-add";
import { PokeAlert } from "./(home)/poke-alert";

export const dynamic = "force-dynamic";

const WEEKDAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function formatDateMeta(d: Date): string {
  return `${WEEKDAY[d.getDay()]} · ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
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
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const [reminders, streak, requireVerify, doneToday, pokesUnread, completedToday] =
    await Promise.all([
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
          reminder: { select: { id: true, title: true, group: { select: { name: true } } } },
        },
        take: 5,
      }),
      prisma.completion.findMany({
        where: {
          userId: principal.id,
          completedAt: { gte: todayStart, lt: todayEnd },
        },
        orderBy: { completedAt: "desc" },
        include: {
          reminder: { select: { id: true, title: true } },
        },
        take: 6,
      }),
    ]);

  const showVerifyBanner = requireVerify && !session.user.emailIsVerified;
  const friendsCount = new Set(pokesUnread.map((p) => p.from.id)).size;
  const todoCount = reminders.length;
  const topPoke = pokesUnread[0] ?? null;

  // Bucket reminders by AM (<12h) / PM (≥12h) using dueAt local hour;
  // anything without a dueAt falls into AM.
  const morning: typeof reminders = [];
  const evening: typeof reminders = [];
  for (const r of reminders) {
    const h = r.dueAt ? new Date(r.dueAt).getHours() : 9;
    if (h < 18) morning.push(r);
    else evening.push(r);
  }

  const displayName = session.user.name ?? "你";
  const avI = avatarSlot(session.user.id);

  return (
    <AppShell
      meta={formatDateMeta(new Date())}
      greeting="今天"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="today"
      trailing={
        <Link href="/app/me" aria-label="个人主页">
          <Avatar name={displayName} size={36} i={avI} />
        </Link>
      }
    >
      <p className="rt-h-body mt-1 mb-4" data-testid="today-summary">
        {friendsCount > 0 ? (
          <span className="rt-text-poke">
            {friendsCount} 个朋友想到你
          </span>
        ) : (
          <span className="rt-text-mute">没人催你 · 节奏由你定</span>
        )}
        {" · "}
        <b data-testid="banner-done-count" className="text-rt-ink">
          {doneToday}
        </b>{" "}
        件小赢已收下 · {todoCount} 件待办
      </p>

      {showVerifyBanner && (
        <div className="mb-4">
          <SketchNotice tone="warn" testid="email-not-verified-banner" animate>
            提醒：你还没验证邮箱。请打开注册时收到的邮件，点击里面的链接完成验证。
          </SketchNotice>
        </div>
      )}

      {/* 今日小赢 celebration card */}
      <div
        data-testid="today-banner"
        className="rt-fade-up rt-box rt-box-thick flex items-center gap-2.5 px-3 py-2 mb-3"
        style={{
          background: "var(--rt-ok-soft)",
          borderColor: "var(--rt-ok)",
        }}
      >
        <span className="inline-flex rt-text-ok flex-shrink-0">
          <Icon name="confetti" size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="rt-h-row"
            style={{
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
              fontSize: 15,
            }}
          >
            你今天已经搞定 <b>{doneToday} 件</b> {doneToday > 0 ? "啦" : "— 慢慢来"}
          </p>
          <p className="rt-h-meta rt-text-ok">
            连胜 <span data-testid="banner-streak">{streak.current}</span> 天 · 还剩{" "}
            <span data-testid="banner-shield">{streak.shieldCards}</span> 张保护卡
          </p>
        </div>
        <span
          className="rt-chip"
          style={{
            borderColor: "var(--rt-ok)",
            color: "var(--rt-ok)",
            fontSize: 12,
            gap: 3,
          }}
        >
          <Icon name="shield" size={11} /> ×{streak.shieldCards}
        </span>
      </div>

      {topPoke && (
        <PokeAlert
          poke={{
            id: topPoke.id,
            fromName: topPoke.from.displayName,
            tone: topPoke.tone,
            message: topPoke.message,
            sentAt: topPoke.sentAt.toISOString(),
            reminderId: topPoke.reminder?.id ?? null,
            reminderTitle: topPoke.reminder?.title ?? null,
            groupName: topPoke.reminder?.group?.name ?? null,
          }}
        />
      )}

      <div className="mb-4">
        <QuickAdd />
      </div>

      {morning.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-4 mb-1.5">
            <span className="inline-flex">
              <Icon name="sun" size={15} />
            </span>
            <h2 className="rt-h-h3">早上</h2>
            <span className="rt-h-meta ml-auto">
              {morning.length} 件 ·{" "}
              {morning.filter((r) => r.status === "DONE").length} 完成
            </span>
          </div>
          <div className="rt-box px-3.5">
            <TodayList
              reminders={morning.map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                status: r.status,
                visibility: r.visibility,
                group: r.group ? { id: r.group.id, name: r.group.name } : null,
                dueAt: r.dueAt?.toISOString() ?? null,
                pokeCount: r._count.pokes,
                claimCount: r._count.claims,
              }))}
              compact
              emptyHint=""
            />
          </div>
        </>
      )}

      {evening.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-4 mb-1.5">
            <span className="inline-flex">
              <Icon name="moon" size={15} />
            </span>
            <h2 className="rt-h-h3">晚上</h2>
            <span className="rt-h-meta ml-auto">{evening.length} 件</span>
          </div>
          <div className="rt-box px-3.5">
            <TodayList
              reminders={evening.map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                status: r.status,
                visibility: r.visibility,
                group: r.group ? { id: r.group.id, name: r.group.name } : null,
                dueAt: r.dueAt?.toISOString() ?? null,
                pokeCount: r._count.pokes,
                claimCount: r._count.claims,
              }))}
              compact
              emptyHint=""
            />
          </div>
        </>
      )}

      {todoCount === 0 && completedToday.length === 0 && (
        <p
          data-testid="today-empty"
          className="rt-h-body py-8 text-center text-rt-ink-mute"
        >
          今天暂时没事 — 也好。
        </p>
      )}

      {/* finished peek — dashed dim card with done chips */}
      {completedToday.length > 0 && (
        <div
          data-testid="today-finished"
          className="rt-box rt-box-dashed mt-5 p-2.5"
        >
          <div className="flex items-center gap-1.5">
            <span className="inline-flex rt-text-ok">
              <Icon name="check" size={13} />
            </span>
            <span className="rt-h-meta rt-text-ok">
              今日已收下 {doneToday} 件 · 真不错
            </span>
            <Link
              href="/app/me/streak"
              className="rt-h-meta ml-auto"
              style={{ color: "var(--rt-claim)" }}
            >
              查看
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {completedToday.map((c) => (
              <span
                key={c.id}
                className="rt-chip rt-chip-dim"
                style={{ textDecoration: "line-through" }}
              >
                {c.reminder.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
