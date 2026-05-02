"use client";

import { useActionState } from "react";
import { runStreakTickAction } from "./actions";

interface State {
  ok: boolean;
  message?: string;
  scanned?: number;
  closed?: number;
}

const initial: State = { ok: false };

export function TickButton() {
  const [state, action, pending] = useActionState(runStreakTickAction, initial);
  return (
    <form action={action} className="mt-3">
      <button
        type="submit"
        disabled={pending}
        data-testid="tools-run-tick"
        className="rt-btn rt-btn-primary"
      >
        {pending ? "执行中…" : "立即跑 close-out"}
      </button>
      {state.ok && state.scanned !== undefined && (
        <span
          data-testid="tools-tick-result"
          className="ml-3 font-mono text-[11px] text-rt-ink-soft"
        >
          scanned={state.scanned} closed={state.closed}
        </span>
      )}
      {!state.ok && state.message && (
        <span
          data-testid="tools-tick-error"
          className="ml-3 font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
