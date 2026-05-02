"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rescheduleAction, type RescheduleState } from "./sheet-actions";

const initial: RescheduleState = { ok: false };

interface Props {
  open: boolean;
  onClose: () => void;
  reminderId: string;
  reminderTitle: string;
  originalDueAt: string | null;
}

const STATES = [
  { key: "tired", t: "困", sub: "别勉强" },
  { key: "low", t: "没劲", sub: "低能量" },
  { key: "ok", t: "一般", sub: "可以试" },
  { key: "go", t: "想冲", sub: "现在做" },
] as const;

function fmt(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Direct port of HfL2Reschedule (design/project/hf-screens-L2.jsx
 * lines 174-239). Mechanical replacements only:
 *   - <Phone> + <SheetOverlay>           → our own dim+slide-up overlay
 *   - hardcoded "读书笔记" / 21:00 / 28m  → real reminderTitle + dueAt
 *   - hardcoded suggestion times          → computed from "now" + state
 *   - hardcoded "完成率" annotations       → kept as design copy (Phase
 *     11 will compute real per-user stats)
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
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
  const [stateKey, setStateKey] = useState<(typeof STATES)[number]["key"]>("ok");

  // Compute the 4 suggestions based on now + state.
  const suggestions = (() => {
    const now = new Date();
    const halfHour = new Date(now.getTime() + 30 * 60_000);
    const tmrwMorning = new Date(now);
    tmrwMorning.setDate(tmrwMorning.getDate() + 1);
    tmrwMorning.setHours(7, 0, 0, 0);
    const weekend = new Date(now);
    const dow = weekend.getDay();
    const offset = (6 - dow + 7) % 7 || 7;
    weekend.setDate(weekend.getDate() + offset);
    weekend.setHours(10, 0, 0, 0);

    return [
      {
        key: "soon",
        iso: halfHour.toISOString(),
        t: "半小时后",
        s: `${fmt(halfHour)} · 你睡前常用`,
        hand: "✓ 60% 完成率",
      },
      {
        key: "morning",
        iso: tmrwMorning.toISOString(),
        t: "明早 7:00",
        s: "比晚上更精神",
        hand: "↑ 78% 完成率",
      },
      {
        key: "weekend",
        iso: weekend.toISOString(),
        t: "本周末",
        s: "攒到周六一起",
        hand: "记得写",
      },
      // The "自定义…" row can land in Phase 11 once we add a date picker
      // sheet; for now the three suggestions above cover most needs.
    ];
  })();

  // Pick the design's "selected" suggestion based on stateKey:
  //  困/没劲 → 明早 (morning)
  //  其他   → 半小时后 (soon)
  const defaultSelected =
    stateKey === "tired" || stateKey === "low" ? "morning" : "soon";
  const [selKey, setSelKey] = useState<string>(defaultSelected);

  useEffect(() => {
    setSelKey(defaultSelected);
  }, [defaultSelected]);

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

  const selected = suggestions.find((s) => s.key === selKey) ?? suggestions[0];

  return (
    <div
      data-testid="reschedule-sheet"
      className="hf"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(40,28,20,0.32)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderTop: "2px solid var(--ink)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -4px 0 var(--line)",
          padding: "8px 0 14px",
          maxWidth: "36rem",
          margin: "0 auto",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            background: "var(--ink-faint)",
            borderRadius: 2,
            margin: "4px auto 8px",
          }}
        />
        <div style={{ padding: "0 18px" }}>
          <div className="h-meta" style={{ color: "var(--claim)" }}>
            改约一下
          </div>
          <div className="h-h2" style={{ marginTop: 2 }}>
            {reminderTitle} — 什么时候做？
          </div>
          {originalDueAt && (
            <div
              className="h-body"
              style={{
                fontSize: 13,
                color: "var(--ink-faint)",
                marginTop: 4,
              }}
            >
              原定 {fmt(new Date(originalDueAt))}
              {lateText && ` · ${lateText}`}
            </div>
          )}

          {/* state estimator */}
          <div
            className="hf-box"
            style={{
              marginTop: 12,
              padding: 10,
              background: "var(--claim-soft)",
            }}
            data-testid="reschedule-state"
          >
            <div className="h-meta">现在状态？</div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {STATES.map((opt) => {
                const sel = stateKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStateKey(opt.key)}
                    data-testid={`reschedule-state-${opt.key}`}
                    data-active={sel ? "true" : undefined}
                    className={`hf-chip ${sel ? "fill" : ""}`}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      flexDirection: "column",
                      padding: "6px 0",
                      gap: 1,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontFamily: "var(--hand-2)" }}>{opt.t}</span>
                    <span
                      className="h-meta"
                      style={{
                        fontSize: 10,
                        color: sel
                          ? "rgba(255,255,255,0.75)"
                          : "var(--ink-mute)",
                      }}
                    >
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* suggestions */}
          <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>
            建议改到
          </div>
          <form action={action}>
            <input type="hidden" name="id" value={reminderId} />
            <input type="hidden" name="dueAt" value={selected.iso} />
            <div className="hf-box" style={{ padding: "4px 12px" }}>
              {suggestions.map((opt, i, a) => {
                const sel = opt.key === selKey;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelKey(opt.key)}
                    data-testid={`reschedule-suggest-${opt.key}`}
                    data-active={sel ? "true" : undefined}
                    className="hf-row w-full text-left"
                    style={{
                      borderBottom:
                        i === a.length - 1
                          ? "none"
                          : "1.3px dashed var(--ink-faint)",
                      background: sel ? "var(--claim-soft)" : "transparent",
                      margin: sel ? "0 -10px" : 0,
                      padding: sel ? "8px 10px" : undefined,
                      borderRadius: sel ? 8 : 0,
                    }}
                  >
                    <span className={`hf-radio ${sel ? "on" : ""}`} />
                    <div style={{ flex: 1 }}>
                      <div className="h-row" style={{ fontSize: 15 }}>
                        {opt.t}
                      </div>
                      <div className="h-meta">{opt.s}</div>
                    </div>
                    {opt.hand && (
                      <span
                        className="h-meta"
                        style={{ color: "var(--ok)", fontSize: 11 }}
                      >
                        {opt.hand}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {state.message && !state.ok && (
              <div
                data-testid="reschedule-error"
                className="rt-nudge h-meta"
                style={{ marginTop: 8, color: "var(--poke)" }}
              >
                {state.message}
              </div>
            )}
            {state.ok && (
              <div
                data-testid="reschedule-ok"
                className="h-meta"
                style={{ marginTop: 8, color: "var(--ok)" }}
              >
                改好了 ✓
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={onClose}
                className="hf-btn ghost"
                style={{ flex: 1, padding: "10px 0", fontSize: 14 }}
                data-testid="reschedule-cancel"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending}
                className="hf-btn primary"
                style={{ flex: 2, padding: "10px 0", fontSize: 14 }}
                data-testid="reschedule-confirm"
              >
                {pending ? "改…" : `改到 ${fmt(new Date(selected.iso))}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
