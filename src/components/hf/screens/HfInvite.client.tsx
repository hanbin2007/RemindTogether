"use client";

import { useActionState, useState } from "react";
import { HF } from "@/components/hf";
import {
  issueInviteAction,
  type InviteState,
} from "@/app/app/groups/actions";

const initial: InviteState = { ok: false };

/**
 * The QR + link card body. Lives inside the `<div className="hf-box">`
 * shell drawn by HfInvite. Two states:
 *
 *   1. No url yet → "生成" submit (testid invite-issue-submit)
 *   2. URL present (from server prop OR from action result) → URL +
 *      copy/share buttons (invite-result, invite-url, invite-copy)
 */
export function InviteIssueCard({
  groupId,
  groupName,
  initialUrl,
}: {
  groupId: string;
  groupName: string;
  initialUrl: string | null;
}) {
  const [state, action, pending] = useActionState(issueInviteAction, initial);
  const [copied, setCopied] = useState(false);
  const url = state.ok && state.url ? state.url : initialUrl;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="h-meta">邀请链接</div>
      {url ? (
        <div
          className="hf-box dim tight"
          style={{
            marginTop: 4,
            padding: 6,
            fontFamily: "var(--mono)",
            fontSize: 11,
            wordBreak: "break-all",
          }}
          data-testid="invite-result"
        >
          <code data-testid="invite-url">{url}</code>
        </div>
      ) : (
        <div
          className="h-meta"
          style={{ marginTop: 4, color: "var(--ink-faint)" }}
        >
          点击下方&quot;生成&quot;得到链接 · 72 小时有效
        </div>
      )}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          gap: 6,
          paddingTop: 8,
        }}
      >
        {url ? (
          <>
            <button
              type="button"
              onClick={() => copy(url)}
              data-testid="invite-copy"
              className="hf-btn primary"
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              {copied ? "已复制 ✓" : "复制"}
            </button>
            <button
              type="button"
              data-testid="invite-share"
              onClick={() =>
                navigator.share?.({
                  title: `${groupName} 邀请你`,
                  url,
                })
              }
              className="hf-btn ghost"
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              分享
            </button>
          </>
        ) : (
          <form action={action}>
            <input type="hidden" name="groupId" value={groupId} />
            <button
              type="submit"
              disabled={pending}
              data-testid="invite-issue-submit"
              className="hf-btn primary"
              style={{
                padding: "4px 10px",
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <HF.Icon name="plus" size={11} />
              {pending ? "生成…" : "生成"}
            </button>
          </form>
        )}
      </div>
      {state.message && !state.ok && (
        <p
          data-testid="invite-error"
          className="h-meta"
          style={{ marginTop: 6, color: "var(--poke)" }}
        >
          {state.message}
        </p>
      )}
    </>
  );
}
