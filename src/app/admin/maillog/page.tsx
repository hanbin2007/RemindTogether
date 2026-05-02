import { listMailLog, listMailLogQuerySchema } from "@/services/admin/maillog";

export const dynamic = "force-dynamic";

export default async function AdminMailLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const query = listMailLogQuerySchema.parse({
    q: sp.q || undefined,
    category: sp.category || undefined,
  });
  const rows = await listMailLog(query);

  return (
    <div data-testid="admin-maillog">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        邮件日志
      </h1>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="收件人邮箱"
          className="rt-input flex-1 min-w-[180px]"
          data-testid="maillog-q"
        />
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          className="rt-input w-44"
        >
          <option value="">全部类别</option>
          <option value="EMAIL_VERIFICATION">EMAIL_VERIFICATION</option>
          <option value="PASSWORD_RESET">PASSWORD_RESET</option>
          <option value="GROUP_INVITE">GROUP_INVITE</option>
          <option value="OTHER">OTHER</option>
        </select>
        <button type="submit" className="rt-btn rt-btn-primary">
          搜索
        </button>
      </form>

      <ul className="mt-6 space-y-2 text-sm" data-testid="maillog-list">
        {rows.length === 0 ? (
          <li
            data-testid="maillog-empty"
            className="font-[family-name:var(--font-kalam)] text-rt-ink-mute"
          >
            无记录
          </li>
        ) : (
          rows.map((m) => (
            <li
              key={m.id}
              className="rt-box-tight bg-rt-paper-2 px-3 py-3"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
              data-testid={`maillog-row-${m.id}`}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
                  {m.category}
                </span>
                <span className="font-[family-name:var(--font-caveat)] font-semibold">
                  → {m.toAddress}
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {m.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  {m.sentAt ? " ✓" : m.errorReason ? " ✗" : "…"}
                </span>
              </div>
              <p className="mt-1 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm">
                {m.subject}
              </p>
              <pre className="mt-1 font-mono text-[10px] text-rt-ink-soft whitespace-pre-wrap">
                {m.body}
              </pre>
              {m.errorReason && (
                <p className="mt-1 font-mono text-[10px] text-[color:var(--rt-poke)]">
                  err: {m.errorReason}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
