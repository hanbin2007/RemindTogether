import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const NAV: Array<{ href: string; label: string; testid: string }> = [
  { href: "/admin", label: "看板", testid: "admin-nav-dashboard" },
  { href: "/admin/users", label: "用户", testid: "admin-nav-users" },
  { href: "/admin/groups", label: "群组", testid: "admin-nav-groups" },
  { href: "/admin/reminders", label: "提醒", testid: "admin-nav-reminders" },
  { href: "/admin/reports", label: "举报", testid: "admin-nav-reports" },
  { href: "/admin/config", label: "配置", testid: "admin-nav-config" },
  { href: "/admin/audit", label: "审计", testid: "admin-nav-audit" },
  { href: "/admin/maillog", label: "邮件", testid: "admin-nav-maillog" },
  { href: "/admin/tools", label: "工具", testid: "admin-nav-tools" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Live re-check from DB (cached 10 s) so demoted admins lose access
  // immediately on the next page load, JWT staleness be damned.
  try {
    await requireAdmin();
  } catch {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-rt-ink-faint bg-rt-paper-2 px-4 py-6">
        <Link
          href="/app"
          className="block font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute mb-6 hover:text-rt-ink"
        >
          ← APP
        </Link>
        <h2
          data-testid="admin-title"
          className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-2xl mb-4"
        >
          管理后台
        </h2>
        <nav className="flex md:flex-col flex-wrap gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testid}
              className="rt-box-tight bg-rt-paper px-3 py-1.5 text-[14px] hover:bg-rt-paper-warm transition-colors"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
