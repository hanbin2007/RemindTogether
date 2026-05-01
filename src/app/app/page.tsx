import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listReminders } from "@/services/reminders";
import { getStreakStatus } from "@/services/streaks";
import { ConfigKey, getConfigBool } from "@/services/config";
import { AppShell } from "@/components/sketch/app-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { TodayList } from "./(home)/today-list";
import { QuickAdd } from "./(home)/quick-add";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const [reminders, streak, requireVerify] = await Promise.all([
    listReminders(principal, "today"),
    getStreakStatus(principal),
    getConfigBool(ConfigKey.RequireEmailVerification),
  ]);

  const doneToday = reminders.filter((r) => r.status === "DONE").length;
  const showVerifyBanner = requireVerify && !session.user.emailIsVerified;

  return (
    <AppShell
      greeting={hello(session.user.name ?? "你")}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="today"
    >
      {showVerifyBanner && (
        <div className="mb-5">
          <SketchNotice tone="warn" testid="email-not-verified-banner" animate>
            提醒：你还没验证邮箱。请打开注册时收到的邮件，点击里面的链接完成验证。
          </SketchNotice>
        </div>
      )}

      {/* Today's win banner — small celebratory line */}
      <div
        data-testid="today-banner"
        className="rt-fade-up rt-box p-4 mb-5"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
          TODAY · 今日小赢
        </p>
        <p className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-2xl leading-tight">
          已搞定{" "}
          <span className="rt-hl" data-testid="banner-done-count">
            {doneToday}
          </span>{" "}
          件 · 连胜{" "}
          <span className="rt-hl" data-testid="banner-streak">
            {streak.current}
          </span>{" "}
          天 · 保护卡{" "}
          <span data-testid="banner-shield">{streak.shieldCards}</span>{" "}
          张
        </p>
      </div>

      <div className="mb-5">
        <QuickAdd />
      </div>

      <TodayList
        reminders={reminders.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          visibility: r.visibility,
          group: r.group ? { id: r.group.id, name: r.group.name } : null,
        }))}
        emptyHint="今天暂时没事 — 也好。"
      />
    </AppShell>
  );
}

function hello(name: string): string {
  const h = new Date().getHours();
  if (h < 5) return `夜深了，${name}`;
  if (h < 12) return `早，${name}`;
  if (h < 18) return `下午好，${name}`;
  return `晚上好，${name}`;
}
