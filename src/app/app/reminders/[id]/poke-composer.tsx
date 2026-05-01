"use client";

import { useActionState, useState } from "react";
import { sendPokeAction, type PokeState } from "./actions";

const initial: PokeState = { ok: false };

const TONES: Array<{ value: "ALMOST" | "THINKING" | "NO_RUSH"; label: string }> = [
  { value: "ALMOST", label: "差一点点" },
  { value: "THINKING", label: "想到你了" },
  { value: "NO_RUSH", label: "不急慢慢来" },
];

interface Props {
  reminderId: string;
  candidates: Array<{ id: string; displayName: string }>;
}

export function PokeComposer({ reminderId, candidates }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendPokeAction, initial);
  const [tone, setTone] = useState<"ALMOST" | "THINKING" | "NO_RUSH">(
    "ALMOST",
  );

  if (candidates.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="poke-open"
        className="rt-btn rt-btn-poke"
      >
        ✿ 拍拍 ta
      </button>
    );
  }

  return (
    <div
      data-testid="poke-composer"
      className="rt-poke-arrival rt-box p-4"
      style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
        POKE · 鼓励而非催促
      </p>
      <form
        action={(fd) => {
          fd.set("reminderId", reminderId);
          return action(fd);
        }}
        className="mt-3 space-y-3"
      >
        <label className="block">
          <span className="font-[family-name:var(--font-caveat)] font-semibold text-base text-rt-ink">
            拍谁
          </span>
          <select
            name="toUserId"
            data-testid="poke-target"
            required
            className="rt-input mt-1 w-full"
            defaultValue={candidates[0]?.id}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="font-[family-name:var(--font-caveat)] font-semibold text-base text-rt-ink">
            语气
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {TONES.map((t) => (
              <label
                key={t.value}
                data-testid={`poke-tone-${t.value}`}
                data-active={tone === t.value ? "true" : undefined}
                className={`rt-box-tight px-3 py-1 cursor-pointer text-sm ${
                  tone === t.value
                    ? "bg-[color:var(--rt-poke-soft)] text-[color:var(--rt-poke)]"
                    : "bg-rt-paper text-rt-ink"
                }`}
                style={{
                  borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px",
                }}
              >
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={() => setTone(t.value)}
                  className="hidden"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="font-[family-name:var(--font-caveat)] font-semibold text-base text-rt-ink">
            一两句话（可选）
          </span>
          <input
            name="message"
            type="text"
            maxLength={140}
            data-testid="poke-message"
            placeholder="想跟 ta 说什么"
            className="rt-input mt-1 w-full"
          />
        </label>

        {state.message && !state.ok && (
          <p
            data-testid="poke-error"
            className="rt-nudge font-mono text-[11px] text-[color:var(--rt-poke)]"
          >
            {state.message}
          </p>
        )}
        {state.ok && (
          <p
            data-testid="poke-ok"
            className="font-[family-name:var(--font-kalam)] text-[color:var(--rt-done)]"
          >
            送到了 · 今日还能拍 {state.remaining} 次
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            data-testid="poke-submit"
            className="rt-btn rt-btn-poke flex-1"
          >
            {pending ? "送…" : "送出"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-testid="poke-cancel"
            className="rt-btn"
          >
            收起
          </button>
        </div>
      </form>
    </div>
  );
}
