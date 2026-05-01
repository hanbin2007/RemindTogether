import {
  listAllReminders,
  listRemindersQuerySchema,
} from "@/services/admin/reminders";
import {
  adminSoftDeleteAction,
  adminUndeleteAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    visibility?: string;
    status?: string;
    isDeleted?: string;
  }>;
}) {
  const sp = await searchParams;
  const query = listRemindersQuerySchema.parse({
    q: sp.q || undefined,
    visibility: sp.visibility || undefined,
    status: sp.status || undefined,
    isDeleted: sp.isDeleted || undefined,
  });
  const reminders = await listAllReminders(query);

  return (
    <div data-testid="admin-reminders">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        提醒
      </h1>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="标题"
          className="rt-input flex-1 min-w-[180px]"
          data-testid="reminders-q"
        />
        <select
          name="visibility"
          defaultValue={sp.visibility ?? ""}
          className="rt-input w-32"
        >
          <option value="">全部</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="GROUP">GROUP</option>
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rt-input w-32"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DONE">DONE</option>
          <option value="SKIPPED">SKIPPED</option>
        </select>
        <select
          name="isDeleted"
          defaultValue={sp.isDeleted ?? ""}
          className="rt-input w-32"
        >
          <option value="">全部</option>
          <option value="false">未删除</option>
          <option value="true">已删除</option>
        </select>
        <button type="submit" className="rt-btn rt-btn-primary">
          搜索
        </button>
      </form>

      <ul className="mt-6 space-y-2 text-sm">
        {reminders.length === 0 ? (
          <li
            data-testid="reminders-empty"
            className="font-[family-name:var(--font-kalam)] text-rt-ink-mute"
          >
            没有匹配的提醒
          </li>
        ) : (
          reminders.map((r) => (
            <li
              key={r.id}
              data-testid={`reminders-row-${r.id}`}
              className="rt-box-tight bg-rt-paper-2 px-3 py-3"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-[family-name:var(--font-caveat)] font-semibold text-lg">
                  {r.title}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
                  {r.visibility} · {r.status}{r.isDeleted ? " · DELETED" : ""}
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {r.creator.displayName}
                  {r.group ? ` · 群 ${r.group.name}` : ""}
                </span>
              </div>
              <div className="mt-2">
                {r.isDeleted ? (
                  <form action={adminUndeleteAction}>
                    <input type="hidden" name="reminderId" value={r.id} />
                    <button
                      type="submit"
                      data-testid={`reminders-row-${r.id}-undelete`}
                      className="rt-btn"
                    >
                      恢复
                    </button>
                  </form>
                ) : (
                  <form action={adminSoftDeleteAction}>
                    <input type="hidden" name="reminderId" value={r.id} />
                    <button
                      type="submit"
                      data-testid={`reminders-row-${r.id}-delete`}
                      className="rt-btn rt-btn-poke"
                    >
                      下架
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
