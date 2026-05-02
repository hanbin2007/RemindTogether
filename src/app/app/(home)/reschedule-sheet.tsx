"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/sketch/icon";
import { rescheduleAction, type RescheduleState } from "./sheet-actions";

const initial: RescheduleState = { ok: false };

interface Props {
  open: boolean;
  onClose: () => void;
  reminderId: string;
  reminderTitle: string;
  /** Original due time as ISO. Determines how late we are + which
   *  suggestions are relevant. */
  originalDueAt: string | null;
}

const STATES: Array<{ key: string; label: string; sub: string }> = [
  { key: "tired", label: "困", sub: "别勉强" },
  { key: "low", label: "没劲", sub: "低能量" },
  { key: "ok", label: "一般", sub: "可以试" },
  { key: "go", label: "想冲", sub: "现在做" },
];

/**
 * Compute 4 suggestion options based on the user's current state.
 * Returns a list with `time` (ISO), `label` and `hand` (small annotation).
 */
function buildSuggestions(stateKey: string): Array<{
  iso: string;
  label: string;
  sub: string;
  hand?: string;
  primary?: boolean;
}> {
  const now = new Date();
  // 30 minutes from now
  const halfHour = new Date(now.getTime() + 30 * 60_000);
  const tmrwMorning = new Date(now);
  tmrwMorning.setDate(tmrwMorning.getDate() + 1);
  tmrwMorning.setHours(7, 0, 0, 0);
  const weekend = new Date(now);
  // Find the next Saturday at 10:00.
  const dow = weekend.getDay();
  const offset = (6 - dow + 7) % 7 || 7;
  weekend.setDate(weekend.getDate() + offset);
  weekend.setHours(10, 0, 0, 0);

  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const halfHourPrimary = stateKey !== "tired" && stateKey !== "low";
  const morningPrimary = stateKey === "tired" || stateKey === "low";

  return [
    {
      iso: halfHour.toISOString(),
      label: "半小时后",
      sub: `${fmt(halfHour)} · 你睡前常用`,
      hand: "✓ 60% 完成率",
      primary: halfHourPrimary,
    },
    {
      iso: tmrwMorning.toISOString(),
      label: "明早 7:00",
      sub: "比晚上更精神",
      hand: "↑ 78% 完成率",
      primary: morningPrimary,
    },
    {
      iso: weekend.toISOString(),
      label: "本周末",
      sub: `${weekend.getMonth() + 1}/${weekend.getDate()} · 攒到周六`,
      hand: "记得写",
    },
  ];
}

/**
 * HfL2Reschedule — sheet that asks the user how they're feeling and
 * suggests three plausible new times based on the answer. Mirrors
 * design/project/hf-screens-L2.jsx lines 174-238.
 */
export function RescheduleSheet({
  open,
  onClose,
  reminderId,
  reminderTitle,
  originalDueAt,
}: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(rescheduleAction, initial);
  const [stateKey, setStateKey] = useState("ok");
  const suggestions = buildSuggestions(stateKey);
  const [selectedIso, setSelectedIso] = useState(suggestions[0].iso);

  useEffect(() => {
    // When state changes, pick the new "primary" suggestion as default.
    const primary = suggestions.find((s) => s.primary) ?? suggestions[0];
    setSelectedIso(primary.iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => {
        onClose();
        router.refresh();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [state.ok, onClose, router]);

  if (!open) return null;

  // Lateness display
  const lateText = (() => {
    if (!originalDueAt) return null;
    const ms = Date.now() - new Date(originalDueAt).getTime();
    if (ms < 0) return null;
    const m = Math.floor(ms / 60_000);
    if (m < 60) return `已晚 ${m} 分钟`;
    const h = Math.floor(m / 60);
    if (h < 24) return `已晚 ${h} 小时`;
    return `已晚 ${Math.floor(h / 24)} 天`;
  })();

  const selected = suggestions.find((s) => s.iso === selectedIso);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <div
      data-testid="reschedule-sheet"
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(40,28,20,0.40)" }}
      onClick={onClose}
    >
      <div
        className="rt-box rt-box-thick w-full max-w-xl px-4 pt-3 pb-5"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--rt-paper)",
          borderRadius: "20px 18px 0 0 / 16px 22px 0 0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: 40,
            height: 4,
            background: "var(--rt-ink-faint)",
            borderRadius: 2,
            marginBottom: 10,
          }}
        />
        <p
          className="rt-h-meta"
          style={{ color: "var(--rt-claim)" }}
        >
          改约一下
        </p>
        <h2 className="rt-h-h2 mt-1">{reminderTitle} — 什么时候做？</h2>
        {originalDueAt && (
          <p
            className="rt-h-body"
            style={{ fontSize: 13, color: "var(--rt-ink-faint)", marginTop: 4 }}
          >
            原定 {fmt(new Date(originalDueAt))}
            {lateText && ` · ${lateText}`}
          </p>
        )}

        {/* state estimator */}
        <div
          className="rt-box mt-3 p-2.5"
          style={{ background: "var(--rt-claim-soft)" }}
          data-testid="reschedule-state"
        >
          <p className="rt-h-meta">现在状态？</p>
          <div className="flex gap-1 mt-1.5">
            {STATES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStateKey(s.key)}
                data-testid={`reschedule-state-${s.key}`}
                data-active={stateKey === s.key ? "true" : undefined}
                className={`rt-chip flex-1 flex-col gap-0.5 ${stateKey === s.key ? "rt-chip-fill" : ""}`}
                style={{
                  padding: "6px 0",
                  fontSize: 13,
                }}
              >
                <span style={{ fontFamily: "var(--font-kalam), Kalam, sans-serif" }}>
                  {s.label}
                </span>
                <span
                  className="rt-h-meta"
                  style={{
                    fontSize: 10,
                    color:
                      stateKey === s.key
                        ? "rgba(255,255,255,0.75)"
                        : "var(--rt-ink-mute)",
                  }}
                >
                  {s.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* suggestions */}
        <p className="rt-h-meta mt-3.5 mb-1">建议改到</p>
        <form action={action} className="rt-box px-3" data-testid="reschedule-form">
          <input type="hidden" name="id" value={reminderId} />
          <input type="hidden" name="dueAt" value={selectedIso} />
          {suggestions.map((opt, i) => {
            const sel = opt.iso === selectedIso;
            return (
              <button
                key={opt.iso}
                type="button"
                data-testid={`reschedule-suggest-${i}`}
                data-active={sel ? "true" : undefined}
                onClick={() => setSelectedIso(opt.iso)}
                className="rt-row w-full text-left"
                style={{
                  background: sel ? "var(--rt-claim-soft)" : "transparent",
                  borderRadius: sel ? 8 : 0,
                  borderBottom:
                    i === suggestions.length - 1
                      ? "none"
                      : "1.3px dashed var(--rt-ink-faint)",
                  padding: sel ? "8px 10px" : undefined,
                  margin: sel ? "0 -10px" : 0,
                }}
              >
                <span
                  className={`rt-radio ${sel ? "is-on" : ""}`}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="rt-h-row" style={{ fontSize: 15 }}>
                    {opt.label}
                  </p>
                  <p className="rt-h-meta">{opt.sub}</p>
                </div>
                {opt.hand && (
                  <span
                    className="rt-h-meta"
                    style={{ color: "var(--rt-ok)", fontSize: 11 }}
                  >
                    {opt.hand}
                  </span>
                )}
              </button>
            );
          })}

          {state.message && !state.ok && (
            <p
              data-testid="reschedule-error"
              className="rt-nudge rt-h-meta mt-2"
              style={{ color: "var(--rt-poke)" }}
            >
              {state.message}
            </p>
          )}
          {state.ok && (
            <p
              data-testid="reschedule-ok"
              className="rt-h-meta mt-2"
              style={{ color: "var(--rt-ok)" }}
            >
              改好了 ✓
            </p>
          )}

          <div className="flex gap-2 mt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rt-btn rt-btn-ghost flex-1"
              style={{ padding: "10px 0", fontSize: 14 }}
              data-testid="reschedule-cancel"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rt-btn rt-btn-primary"
              style={{ flex: 2, padding: "10px 0", fontSize: 14 }}
              data-testid="reschedule-confirm"
            >
              {pending
                ? "改…"
                : selected
                  ? `改到 ${fmt(new Date(selected.iso))}`
                  : "改到 …"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
