import Link from "next/link";
import { getReport } from "@/services/admin/reports";
import { previewReportContent } from "@/services/reports";
import { dismissAction, resolveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  const preview = await previewReportContent(
    report.contentType,
    report.contentId,
  );
  const isPending = report.status === "PENDING";

  return (
    <div data-testid="admin-report-detail">
      <Link href="/admin/reports" className="rt-squig text-rt-ink-soft text-sm">
        ← 举报队列
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        举报详情
      </h1>
      <p
        data-testid="report-status"
        className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-rt-ink-mute"
      >
        {report.status}
        {report.adminNote ? ` · ${report.adminNote}` : ""}
      </p>

      <div
        className="mt-6 rt-box p-5"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
          原因
        </p>
        <p className="mt-1 font-[family-name:var(--font-kalam)] text-rt-ink-soft">
          {report.reason}
        </p>
      </div>

      <div
        className="mt-4 rt-box p-5 bg-rt-paper-2"
        data-testid="report-preview"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
          被举报内容（{report.contentType}）
        </p>
        {preview.kind === "tombstone" ? (
          <p
            data-testid="report-preview-tombstone"
            className="mt-2 font-[family-name:var(--font-kalam)] italic text-rt-ink-mute"
          >
            内容已被作者删除或不存在；仍可对此举报作出处理。
          </p>
        ) : (
          <>
            {preview.title && (
              <p className="mt-2 font-[family-name:var(--font-caveat)] font-semibold text-lg">
                {preview.title}
              </p>
            )}
            {preview.body && (
              <p className="mt-1 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm whitespace-pre-wrap">
                {preview.body}
              </p>
            )}
            {preview.authorName && (
              <p className="mt-2 font-mono text-[10px] text-rt-ink-mute">
                作者：{preview.authorName}（{preview.authorId}）
              </p>
            )}
          </>
        )}
      </div>

      {isPending && (
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={resolveAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <input
              type="text"
              name="note"
              placeholder="处理备注（可选）"
              data-testid="report-note"
              className="rt-input w-60 mr-2"
            />
            <button
              type="submit"
              data-testid="action-resolve"
              className="rt-btn rt-btn-primary"
            >
              确认违规并处理
            </button>
          </form>
          <form action={dismissAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <button
              type="submit"
              data-testid="action-dismiss"
              className="rt-btn"
            >
              驳回（不违规）
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
