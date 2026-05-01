import Link from "next/link";
import { listReports, listReportsQuerySchema } from "@/services/admin/reports";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const query = listReportsQuerySchema.parse({
    status: (sp.status as "PENDING" | "RESOLVED" | "DISMISSED" | undefined) ??
      "PENDING",
  });
  const reports = await listReports(query);

  return (
    <div data-testid="admin-reports">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        举报队列
      </h1>
      <form className="mt-4" method="get">
        <select
          name="status"
          defaultValue={sp.status ?? "PENDING"}
          className="rt-input w-44"
          data-testid="reports-status"
        >
          <option value="PENDING">待处理</option>
          <option value="RESOLVED">已处理</option>
          <option value="DISMISSED">已驳回</option>
        </select>
        <button type="submit" className="rt-btn ml-2">
          过滤
        </button>
      </form>

      {reports.length === 0 ? (
        <p
          data-testid="reports-empty"
          className="mt-6 font-[family-name:var(--font-kalam)] text-rt-ink-mute"
        >
          没有匹配的举报
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reports.map((r) => (
            <li
              key={r.id}
              data-testid={`report-row-${r.id}`}
              className="rt-box p-4"
              style={{
                borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px",
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
                  {r.contentType}
                </span>
                <span className="font-[family-name:var(--font-caveat)] font-semibold">
                  {r.reporter.displayName} 举报
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </div>
              <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm">
                {r.reason}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <span
                  data-testid={`report-row-${r.id}-status`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute"
                >
                  {r.status}
                </span>
                <Link
                  href={`/admin/reports/${r.id}`}
                  data-testid={`report-row-${r.id}-detail`}
                  className="rt-squig text-rt-ink"
                >
                  处理
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
