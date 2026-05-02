"use client";

import { useActionState, useEffect, useRef } from "react";
import { createGroupReminderAction, type CreateState } from "./actions";

const initial: CreateState = { ok: false };

export function GroupReminderForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(
    createGroupReminderAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      data-testid="group-reminder-form"
      className="rt-fade-up flex items-center gap-2"
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input
        name="title"
        placeholder="给群里加一件事…"
        required
        maxLength={140}
        autoComplete="off"
        data-testid="group-reminder-input"
        className="rt-input flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        data-testid="group-reminder-submit"
        className="rt-btn rt-btn-primary"
      >
        {pending ? "记一下…" : "+ 加"}
      </button>
      {state.fieldError && (
        <p
          data-testid="group-reminder-error"
          className="ml-2 font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.fieldError}
        </p>
      )}
    </form>
  );
}
