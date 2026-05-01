import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listReminders } from "@/services/reminders";
import { AppShell } from "@/components/sketch/app-shell";
import { TodayList } from "../(home)/today-list";
import { QuickAdd } from "../(home)/quick-add";

export const dynamic = "force-dynamic";

export default async function PrivateRemindersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const reminders = await listReminders(principal, "private");

  return (
    <AppShell
      greeting="私人清单"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="private"
    >
      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-5">
        只有你自己看得到。完成的项目会保留下来作回顾。
      </p>

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
          group: null,
        }))}
        emptyHint="这里还空着 — 想到什么记一下。"
      />
    </AppShell>
  );
}
