"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { HF } from "@/components/sketch/hf";
import { HfL2ShieldConfirm } from "@/components/hf/screens/HfL2ShieldConfirm";
import { skipDayAction, type SkipDayState } from "./sheet-actions";

const initial: SkipDayState = { ok: false };

interface Props {
  open: boolean;
  onClose: () => void;
  cardsLeft: number;
  cap: number;
}

const MOODS = ["累了", "生病了", "在路上", "心情不好", "就是想跳"];

/**
 * Direct port of HfL2SkipDay (design/project/hf-screens-L2.jsx
 * lines 119-171). Mechanical replacements only:
 *   - <Phone> + <SheetOverlay> wrappers → our own dim+slide-up overlay
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded "1 / 2 / 3" shield map  → real cardsLeft + cap
 *   - hardcoded "下周一会再发 3 张"      → dynamic copy based on cap
 *   - mood quick-tap chips (selected on click; sent as hidden form field)
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
export function SkipDaySheet({ open, onClose, cardsLeft, cap }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(skipDayAction, initial);
  const [mood, setMood] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ShieldConfirm "yes" → close gate sheet → submit the underlying form.
  function handleConfirm() {
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  // Compute today's day-of-week (1=Mon ... 7=Sun) so the gate can show
  // a "{N} 天进入本周" hint without a TZ round-trip.
  const today = new Date();
  const dow = today.getDay(); // 0=Sun ... 6=Sat
  const weekDayCount = dow === 0 ? 7 : dow;

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => {
        onClose();
        router.refresh();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [state.ok, onClose, router]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const totalSlots = Math.max(cap, 3);

  return createPortal(
    <div
      data-testid="skip-day-sheet"
      className="hf"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(40,28,20,0.32)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: "var(--paper)",
          borderTop: "2px solid var(--ink)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -4px 0 var(--line)",
          padding: "8px 0 14px",
          maxWidth: "var(--app-max-w)",
          margin: "0 auto",
          width: "100%",
          maxHeight: "85vh",
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
          <div
            className="h-meta"
            style={{
              color: "var(--ok)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <HF.Icon name="shield" size={12} /> 跳过日
          </div>
          <div className="h-h2" style={{ marginTop: 2 }}>
            今天先放过自己
          </div>
          <div
            className="h-body"
            style={{
              fontFamily: "var(--hand-2)",
              fontSize: 16,
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            没事的，谁都有忘的一天。<br />
            跳过日<b>不算输</b>，你的连胜会保留。
          </div>

          <div
            className="hf-box dashed"
            style={{
              marginTop: 14,
              padding: 12,
              background: "var(--ok-soft)",
              borderColor: "var(--ok)",
            }}
            data-testid="skip-day-shield-preview"
          >
            <div className="h-meta">本周保护卡</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              {Array.from({ length: totalSlots }).map((_, idx) => {
                const i = idx + 1;
                const has = i <= cardsLeft;
                return (
                  <div
                    key={i}
                    className="hf-box"
                    style={{
                      width: 36,
                      height: 44,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: has ? "var(--paper)" : "transparent",
                      borderStyle: has ? "solid" : "dashed",
                      opacity: has ? 1 : 0.4,
                      transform: `rotate(${i % 2 ? -3 : 3}deg)`,
                    }}
                  >
                    <HF.Icon
                      name="shield"
                      size={18}
                      color={has ? "var(--ok)" : "var(--ink-faint)"}
                    />
                  </div>
                );
              })}
              <div style={{ flex: 1, marginLeft: 6 }}>
                <div className="h-row" style={{ fontSize: 14 }}>
                  {cardsLeft > 0 ? "用掉 1 张" : "已经没保护卡了"}
                </div>
                <div className="h-meta">
                  {cardsLeft > 0 ? `下周一会再发 ${cap} 张` : "断了再来 — 节奏由你定"}
                </div>
              </div>
            </div>
          </div>

          {/* mood */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            顺便说一句（可选）
          </div>
          <form ref={formRef} action={action} style={{ marginTop: 6 }}>
            <input type="hidden" name="mood" value={mood ?? ""} />
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {MOODS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMood(mood === t ? null : t)}
                  data-testid={`skip-day-mood-${t}`}
                  data-active={mood === t ? "true" : undefined}
                  className={`hf-chip ${mood === t ? "fill" : ""}`}
                  style={{ fontSize: 13 }}
                >
                  {t}
                </button>
              ))}
            </div>

            {state.message && (
              <div
                data-testid="skip-day-message"
                className={`h-meta ${state.ok ? "" : "rt-nudge"}`}
                style={{
                  marginTop: 8,
                  color: state.ok ? "var(--ok)" : "var(--poke)",
                }}
              >
                {state.message}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                className="hf-btn ghost"
                style={{ flex: 1, padding: "10px 0", fontSize: 15 }}
                data-testid="skip-day-cancel"
              >
                再想想
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cardsLeft > 0 && !pending) setConfirmOpen(true);
                }}
                disabled={pending || cardsLeft <= 0}
                className="hf-btn primary"
                style={{ flex: 2, padding: "10px 0", fontSize: 15 }}
                data-testid="skip-day-confirm"
              >
                {pending
                  ? "用掉…"
                  : cardsLeft <= 0
                    ? "没保护卡了"
                    : "用 1 张保护卡"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <HfL2ShieldConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        cardsLeft={cardsLeft}
        cap={cap}
        weekDayCount={weekDayCount}
        onConfirm={handleConfirm}
        pending={pending}
      />
    </div>,
    document.body,
  );
}
