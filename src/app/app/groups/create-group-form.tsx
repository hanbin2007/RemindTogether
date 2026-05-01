"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction, type CreateGroupState } from "./actions";

const initial: CreateGroupState = { ok: false };

export function CreateGroupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createGroupAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.groupId) {
      formRef.current?.reset();
      router.push(`/app/groups/${state.groupId}`);
    }
  }, [state.ok, state.groupId, router]);

  return (
    <form
      ref={formRef}
      action={action}
      data-testid="create-group-form"
      className="rt-fade-up rt-box p-4 flex flex-wrap gap-2 items-center"
      style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
    >
      <input
        type="text"
        name="coverEmoji"
        placeholder="🏃"
        maxLength={4}
        autoComplete="off"
        data-testid="create-group-emoji"
        className="rt-input w-16 text-center"
      />
      <input
        type="text"
        name="name"
        required
        maxLength={40}
        placeholder="给这个群起个名字…"
        autoComplete="off"
        data-testid="create-group-name"
        className="rt-input flex-1 min-w-[160px]"
      />
      <button
        type="submit"
        disabled={pending}
        data-testid="create-group-submit"
        className="rt-btn rt-btn-primary"
      >
        {pending ? "建群中…" : "+ 新建群"}
      </button>
      {state.fieldError && (
        <p
          data-testid="create-group-error"
          className="w-full font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.fieldError}
        </p>
      )}
    </form>
  );
}
