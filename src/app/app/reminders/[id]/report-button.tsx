"use client";

import { useActionState, useEffect, useState } from "react";
import { reportContentAction, type ReportState } from "./actions";

const initial: ReportState = { ok: false };

interface Props {
  contentType: "REMINDER" | "COMMENT";
  contentId: string;
  /** Visual variant. `chip` is the small text trigger used inside CommentRow. */
  variant?: "chip" | "icon";
  /** Test id suffix (eg `reminder-${id}` / `comment-${id}`). */
  testIdSuffix: string;
}

export function ReportButton({
  contentType,
  contentId,
  variant = "icon",
  testIdSuffix,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    reportContentAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => setOpen(false), 1000);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={variant === "chip" ? "hf-chip dim" : "hf-btn ghost"}
        style={{
          fontSize: 11,
          padding: variant === "chip" ? "0 6px" : "2px 8px",
          opacity: 0.7,
        }}
        data-testid={`report-open-${testIdSuffix}`}
        aria-label="举报"
      >
        举报
      </button>
      {open && (
        <div
          className="hf-box"
          data-testid={`report-sheet-${testIdSuffix}`}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            margin: "0 auto",
            maxWidth: 420,
            padding: 16,
            zIndex: 80,
            background: "var(--paper)",
          }}
        >
          <div className="h-h3" style={{ marginBottom: 6 }}>
            举报内容
          </div>
          <div className="h-meta" style={{ marginBottom: 8 }}>
            管理员会看到。请说明原因（最多 500 字）。
          </div>
          <form action={action}>
            <input type="hidden" name="contentType" value={contentType} />
            <input type="hidden" name="contentId" value={contentId} />
            <textarea
              name="reason"
              required
              minLength={1}
              maxLength={500}
              rows={3}
              data-testid={`report-reason-${testIdSuffix}`}
              className="hf-box"
              style={{
                width: "100%",
                padding: 8,
                fontSize: 14,
                fontFamily: "var(--hand-2)",
                background: "var(--paper)",
                resize: "vertical",
              }}
              placeholder="比如：辱骂 / 广告 / 不当内容"
            />
            {state.message && !state.ok && (
              <div
                data-testid={`report-error-${testIdSuffix}`}
                className="h-meta"
                style={{ color: "var(--poke)", marginTop: 6 }}
              >
                {state.message}
              </div>
            )}
            {state.ok && (
              <div
                data-testid={`report-ok-${testIdSuffix}`}
                className="h-meta"
                style={{ color: "var(--ok)", marginTop: 6 }}
              >
                已收到，谢谢反馈。
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hf-btn ghost"
                style={{ flex: 1 }}
                data-testid={`report-cancel-${testIdSuffix}`}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending || state.ok}
                className="hf-btn primary"
                style={{ flex: 1 }}
                data-testid={`report-submit-${testIdSuffix}`}
              >
                {pending ? "提交中…" : state.ok ? "已提交" : "提交"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
