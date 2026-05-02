"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCommentAction, type CommentState } from "./actions";

const initial: CommentState = { ok: false };

export function CommentForm({ reminderId }: { reminderId: string }) {
  const [state, action, pending] = useActionState(addCommentAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      data-testid="comment-form"
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={reminderId} />
      <input
        name="content"
        required
        maxLength={500}
        autoComplete="off"
        placeholder="说点什么…"
        data-testid="comment-input"
        className="rt-input flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        data-testid="comment-submit"
        className="rt-btn"
      >
        {pending ? "发送…" : "发"}
      </button>
      {state.message && !state.ok && (
        <span className="font-mono text-[10px] text-[color:var(--rt-poke)]">
          {state.message}
        </span>
      )}
    </form>
  );
}
