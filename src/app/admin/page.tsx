import { getDashboardKPIs } from "@/services/admin/tools";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const kpis = await getDashboardKPIs();

  const cards = [
    { label: "用户总数", value: kpis.users, testid: "kpi-users" },
    { label: "封禁用户", value: kpis.bannedUsers, testid: "kpi-banned" },
    { label: "管理员", value: kpis.admins, testid: "kpi-admins" },
    { label: "群组", value: kpis.groups, testid: "kpi-groups" },
    { label: "已解散群组", value: kpis.disbandedGroups, testid: "kpi-disbanded" },
    { label: "活跃提醒", value: kpis.reminders, testid: "kpi-reminders" },
    { label: "今日新提醒", value: kpis.remindersToday, testid: "kpi-reminders-today" },
    { label: "今日完成", value: kpis.completionsToday, testid: "kpi-completions-today" },
    { label: "今日拍拍", value: kpis.pokesToday, testid: "kpi-pokes-today" },
    { label: "待处理举报", value: kpis.reportsPending, testid: "kpi-reports-pending" },
    { label: "Push 订阅", value: kpis.pushSubscriptions, testid: "kpi-push" },
    { label: "今日邮件", value: kpis.mailLogToday, testid: "kpi-mail-today" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        看板
      </h1>
      <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft">
        系统总览（UTC 日界）。今日数字会随活动滚动。
      </p>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.testid}
            data-testid={c.testid}
            className="rt-box p-4"
            style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
              {c.label}
            </p>
            <p
              className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-3xl"
              data-testid={`${c.testid}-value`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
