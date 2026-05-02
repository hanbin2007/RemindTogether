"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTagAction, type TagState } from "./actions";

const initial: TagState = { ok: false };

const PRESET_COLORS = [
  "#3366cc",
  "#cc4d3a",
  "#3aa55a",
  "#d4a017",
  "#7d3aa5",
  "#888888",
];

export function TagForm() {
  const [state, action, pending] = useActionState(createTagAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      data-testid="tag-form"
      className="rt-fade-up rt-box p-3 flex flex-wrap items-center gap-2"
      style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
    >
      <input
        name="name"
        required
        maxLength={20}
        placeholder="标签名"
        data-testid="tag-name"
        autoComplete="off"
        className="rt-input flex-1 min-w-[120px]"
      />
      <select
        name="iconName"
        defaultValue="tag"
        className="rt-input w-24"
        data-testid="tag-icon"
      >
        <option value="tag">📌</option>
        <option value="book">📖</option>
        <option value="run">🏃</option>
        <option value="heart">❤</option>
        <option value="star">★</option>
      </select>
      <select
        name="color"
        defaultValue={PRESET_COLORS[0]}
        className="rt-input w-24"
        data-testid="tag-color"
      >
        {PRESET_COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        data-testid="tag-submit"
        className="rt-btn rt-btn-primary"
      >
        {pending ? "..." : "+ 加"}
      </button>
      {state.message && !state.ok && (
        <p
          data-testid="tag-error"
          className="w-full font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
