"use client";

import { useActionState, useState } from "react";
import { issueInviteAction, type InviteState } from "../actions";

const initial: InviteState = { ok: false };

export function InviteButton({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(issueInviteAction, initial);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.url) return;
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={action} data-testid="invite-form">
        <input type="hidden" name="groupId" value={groupId} />
        <button
          type="submit"
          disabled={pending}
          data-testid="invite-issue"
          className="rt-btn"
        >
          {pending ? "生成中…" : "生成邀请链接"}
        </button>
      </form>

      {state.ok && state.url && (
        <div
          data-testid="invite-result"
          className="rt-drop rt-box-tight bg-rt-paper-2 px-3 py-2"
          style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
        >
          <p className="font-mono text-[10px] text-rt-ink-mute uppercase tracking-[0.14em]">
            分享给朋友 · 72 小时有效
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code
              data-testid="invite-url"
              className="flex-1 font-mono text-[11px] text-rt-ink-soft break-all"
            >
              {state.url}
            </code>
            <button
              type="button"
              onClick={copy}
              data-testid="invite-copy"
              className="rt-btn"
            >
              {copied ? "已复制 ✓" : "复制"}
            </button>
          </div>
        </div>
      )}
      {state.message && !state.ok && (
        <p
          data-testid="invite-error"
          className="font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
