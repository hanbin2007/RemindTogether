"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/sketch/icon";
import {
  completeFromDetailAction,
  toggleClaimAction,
} from "./actions";
import { skipAction } from "../../(home)/today-actions";

interface Props {
  reminderId: string;
  status: "ACTIVE" | "DONE" | "SKIPPED";
  canClaim: boolean;
  myClaim: boolean;
}

/**
 * Sticky bottom bar above the global tabbar — mirrors HfReminderDetail
 * lines 397-405. Primary "收下，发个图" (complete), ghost "今天跳过"
 * (skip today), ghost chat icon to focus the comment input.
 */
export function ReminderActionBar({
  reminderId,
  status,
  canClaim,
  myClaim,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const done = status === "DONE";

  const onComplete = () => {
    if (done || pending) return;
    const fd = new FormData();
    fd.set("id", reminderId);
    start(async () => {
      await completeFromDetailAction(fd);
      router.refresh();
    });
  };

  const onSkip = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", reminderId);
    start(async () => {
      await skipAction(fd);
      router.refresh();
    });
  };

  const onToggleClaim = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", reminderId);
    fd.set("action", myClaim ? "unclaim" : "claim");
    start(async () => {
      await toggleClaimAction(fd);
      router.refresh();
    });
  };

  const focusComment = () => {
    const el = document.querySelector<HTMLInputElement>(
      "[data-testid=comment-input]",
    );
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div
      data-testid="reminder-action-bar"
      className="fixed inset-x-0 z-10"
      style={{
        bottom: 56,
        background: "var(--rt-paper)",
        borderTop: "1.3px dashed var(--rt-ink-faint)",
      }}
    >
      <div className="max-w-xl mx-auto px-3.5 py-2.5 flex gap-1.5">
        {!done && (
          <button
            type="button"
            onClick={onComplete}
            disabled={pending}
            data-testid="reminder-complete"
            className="rt-btn rt-btn-primary flex-1"
            style={{ fontSize: 15 }}
          >
            <Icon name="check" size={14} /> 收下，发个图
          </button>
        )}
        {canClaim && (
          <button
            type="button"
            onClick={onToggleClaim}
            disabled={pending}
            data-testid="reminder-claim"
            className={`rt-btn ${myClaim ? "" : "rt-btn-claim"}`}
            style={{ fontSize: 14 }}
          >
            <Icon name="handshake" size={14} />
            {myClaim ? "取消接" : "我帮 ta"}
          </button>
        )}
        {!done && (
          <button
            type="button"
            onClick={onSkip}
            disabled={pending}
            data-testid="reminder-skip"
            className="rt-btn rt-btn-ghost"
            style={{ fontSize: 13 }}
          >
            今天跳过
          </button>
        )}
        <button
          type="button"
          onClick={focusComment}
          data-testid="reminder-focus-comment"
          className="rt-btn rt-btn-ghost"
          aria-label="评论"
        >
          <Icon name="chat" size={14} />
        </button>
      </div>
    </div>
  );
}
