"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/sketch/icon";
import { issueInviteAction, type InviteState } from "../../actions";

const initial: InviteState = { ok: false };

export function InviteIssue({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [state, action, pending] = useActionState(issueInviteAction, initial);
  const [copied, setCopied] = useState(false);

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
    <div data-testid="invite-issue">
      <form
        action={action}
        data-testid="invite-form"
        className="rt-box p-3 flex gap-3"
      >
        <input type="hidden" name="groupId" value={groupId} />
        {/* QR placeholder using radial dots — exactly the design */}
        <div
          className="rt-box-tight flex-shrink-0 p-1.5"
          style={{
            width: 90,
            height: 90,
            background: "var(--rt-paper)",
            border: "1.6px solid var(--rt-ink)",
            borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px",
          }}
          aria-label="二维码占位"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage:
                "radial-gradient(circle, var(--rt-ink) 1.4px, transparent 1.4px)",
              backgroundSize: "6px 6px",
            }}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <p className="rt-h-meta">邀请链接</p>
          {state.ok && state.url ? (
            <div
              className="rt-box rt-box-dim rt-box-tight mt-1 p-1.5 break-all"
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: 11,
              }}
              data-testid="invite-result"
            >
              <code data-testid="invite-url">{state.url}</code>
            </div>
          ) : (
            <p
              className="rt-h-meta mt-1"
              style={{ color: "var(--rt-ink-faint)" }}
            >
              点击下方"生成"得到链接 · 72 小时有效
            </p>
          )}
          <div className="mt-auto flex gap-1.5 pt-2">
            {state.ok && state.url ? (
              <button
                type="button"
                onClick={() => state.url && copy(state.url)}
                data-testid="invite-copy"
                className="rt-btn rt-btn-primary"
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                {copied ? "已复制 ✓" : "复制"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending}
                data-testid="invite-issue-submit"
                className="rt-btn rt-btn-primary"
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                <Icon name="plus" size={11} />
                {pending ? "生成…" : "生成"}
              </button>
            )}
            {state.ok && state.url && (
              <button
                type="button"
                data-testid="invite-share"
                onClick={() =>
                  state.url &&
                  navigator.share?.({
                    title: `${groupName} 邀请你`,
                    url: state.url,
                  })
                }
                className="rt-btn rt-btn-ghost"
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                分享
              </button>
            )}
          </div>
        </div>
      </form>
      {state.message && !state.ok && (
        <p
          data-testid="invite-error"
          className="rt-h-meta mt-2"
          style={{ color: "var(--rt-poke)" }}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
