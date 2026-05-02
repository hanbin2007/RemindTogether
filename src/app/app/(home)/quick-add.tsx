"use client";

import { useActionState, useEffect, useRef } from "react";
import { createReminderAction, type CreateState } from "./today-actions";

const initial: CreateState = { ok: false };

/**
 * Inline quick-add form for a private reminder. Stays minimal so the
 * "today" page feels light: title only. Tapping ✓ submits; rt-pop
 * animation gives the new row a small celebration as it enters the list.
 */
export function QuickAdd() {
  const [state, action, pending] = useActionState(
    createReminderAction,
    initial,
  );
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.focus();
  }, [state.ok]);

  return (
    <form action={action} className="rt-fade-up flex items-center gap-2">
      <input
        ref={ref}
        name="title"
        placeholder="一件想做的小事…"
        autoComplete="off"
        required
        maxLength={140}
        data-testid="quick-add-input"
        className="rt-input flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        data-testid="quick-add-submit"
        className="rt-btn rt-btn-primary"
      >
        {pending ? "记一下…" : "+ 记一下"}
      </button>
      {state.fieldError && (
        <p
          data-testid="quick-add-error"
          className="ml-2 font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.fieldError}
        </p>
      )}
    </form>
  );
}
