import { listAuditLog } from "@/services/admin/audit";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; targetType?: string }>;
}) {
  const sp = await searchParams;
  const rows = await listAuditLog({
    action: sp.action || undefined,
    targetType: (sp.targetType as
      | "user"
      | "group"
      | "reminder"
      | "report"
      | "config"
      | "system"
      | "invite"
      | "push_subscription"
      | undefined) || undefined,
    limit: 100,
  });

  return (
    <div data-testid="admin-audit">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        审计日志
      </h1>
      <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft">
        所有 destructive 管理动作 append-only 落到这里。
      </p>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="action"
          defaultValue={sp.action ?? ""}
          placeholder="action（例：ban_user）"
          className="rt-input flex-1 min-w-[180px]"
          data-testid="audit-action-q"
        />
        <select
          name="targetType"
          defaultValue={sp.targetType ?? ""}
          className="rt-input w-40"
        >
          <option value="">全部目标</option>
          <option value="user">user</option>
          <option value="group">group</option>
          <option value="reminder">reminder</option>
          <option value="report">report</option>
          <option value="config">config</option>
          <option value="system">system</option>
        </select>
        <button type="submit" className="rt-btn rt-btn-primary">
          过滤
        </button>
      </form>

      <ol className="mt-6 space-y-2 text-sm" data-testid="audit-list">
        {rows.length === 0 ? (
          <li
            data-testid="audit-empty"
            className="font-[family-name:var(--font-kalam)] text-rt-ink-mute"
          >
            无记录
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="rt-box-tight bg-rt-paper-2 px-3 py-2"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
              data-testid={`audit-row-${r.id}`}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-[family-name:var(--font-caveat)] font-semibold text-lg">
                  {r.action}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
                  {r.targetType}{r.targetId ? `:${r.targetId.slice(0, 8)}` : ""}
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {r.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </span>
              </div>
              <p className="font-mono text-[10px] text-rt-ink-mute mt-1">
                by {r.admin.displayName} ({r.admin.email})
              </p>
              {r.payload && (
                <pre className="mt-1 font-mono text-[10px] text-rt-ink-soft whitespace-pre-wrap break-all">
                  {JSON.stringify(r.payload)}
                </pre>
              )}
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
