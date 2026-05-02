"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/sketch/icon";
import { skipDayAction, type SkipDayState } from "./sheet-actions";

const initial: SkipDayState = { ok: false };

interface Props {
  open: boolean;
  onClose: () => void;
  cardsLeft: number;
  cap: number;
}

/**
 * HfL2SkipDay — friendly skip-today sheet that uses a shield card if
 * available and lets the user leave a one-line mood note. Mirrors
 * design/project/hf-screens-L2.jsx lines 119-170.
 *
 * Spawned from the bottom-sheet trigger in the action bar / reminder
 * row "今天跳过" button. Uses a portal-less overlay (just a fixed
 * backdrop + sheet card) — no library needed.
 */
export function SkipDaySheet({ open, onClose, cardsLeft, cap }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(skipDayAction, initial);
  const [mood, setMood] = useState("");

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

  return (
    <div
      data-testid="skip-day-sheet"
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
          maxHeight: "85vh",
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
          className="rt-h-meta inline-flex items-center gap-1"
          style={{ color: "var(--rt-ok)" }}
        >
          <Icon name="shield" size={12} /> 跳过日
        </p>
        <h2 className="rt-h-h2 mt-1">今天先放过自己</h2>
        <p
          className="rt-h-body mt-1.5"
          style={{
            fontFamily: "var(--font-kalam), Kalam, sans-serif",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          没事的，谁都有忘的一天。
          <br />
          跳过日<b>不算输</b>，你的连胜会保留。
        </p>

        {/* shield preview */}
        <div
          className="rt-box rt-box-dashed p-3 mt-3.5"
          style={{
            background: "var(--rt-ok-soft)",
            borderColor: "var(--rt-ok)",
          }}
          data-testid="skip-day-shield-preview"
        >
          <p className="rt-h-meta">本周保护卡</p>
          <div className="flex items-center gap-2 mt-1.5">
            {Array.from({ length: Math.max(cap, 3) }).map((_, i) => {
              const has = i < cardsLeft;
              return (
                <div
                  key={i}
                  className="rt-box flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 44,
                    padding: 0,
                    background: has ? "var(--rt-paper)" : "transparent",
                    borderStyle: has ? "solid" : "dashed",
                    opacity: has ? 1 : 0.4,
                    transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
                  }}
                >
                  <Icon
                    name="shield"
                    size={18}
                    color={has ? "var(--rt-ok)" : "var(--rt-ink-faint)"}
                  />
                </div>
              );
            })}
            <div className="flex-1 ml-1.5">
              <p className="rt-h-row" style={{ fontSize: 14 }}>
                {cardsLeft > 0
                  ? `用掉 1 张（剩 ${cardsLeft - 1}）`
                  : "已经没保护卡了"}
              </p>
              <p className="rt-h-meta">
                {cardsLeft > 0
                  ? "下周一会再发新的"
                  : "断了再来 — 节奏由你定"}
              </p>
            </div>
          </div>
        </div>

        {/* mood */}
        <form action={action} className="mt-3.5">
          <p className="rt-h-meta">顺便说一句（可选）</p>
          <input
            name="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            maxLength={140}
            placeholder="今天有点累 / 在路上 / ..."
            data-testid="skip-day-mood"
            className="rt-input mt-1 w-full"
          />

          {state.message && (
            <p
              data-testid="skip-day-message"
              className={`rt-h-meta mt-2 ${state.ok ? "" : "rt-nudge"}`}
              style={{
                color: state.ok ? "var(--rt-ok)" : "var(--rt-poke)",
              }}
            >
              {state.message}
            </p>
          )}

          <div className="flex gap-2 mt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rt-btn rt-btn-ghost flex-1"
              style={{ padding: "10px 0", fontSize: 14 }}
              data-testid="skip-day-cancel"
            >
              不跳了
            </button>
            <button
              type="submit"
              disabled={pending || cardsLeft <= 0}
              className="rt-btn rt-btn-primary"
              style={{ flex: 2, padding: "10px 0", fontSize: 14 }}
              data-testid="skip-day-confirm"
            >
              {pending
                ? "用掉…"
                : cardsLeft <= 0
                  ? "没保护卡了"
                  : `用掉 1 张 · 跳过今天`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
