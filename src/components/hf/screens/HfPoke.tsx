"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { HF } from "@/components/sketch/hf";
import {
  sendPokeAction,
  type PokeState,
} from "@/app/app/reminders/[id]/actions";

const initial: PokeState = { ok: false };

const PHRASES: Array<{
  t: string;
  tone: "ALMOST" | "THINKING" | "NO_RUSH";
}> = [
  { t: "我也常忘 🫶", tone: "THINKING" },
  { t: "差一点点！", tone: "ALMOST" },
  { t: "想到你了～", tone: "THINKING" },
  { t: "一起搞定？", tone: "ALMOST" },
  { t: "不急，慢慢来", tone: "NO_RUSH" },
  { t: "今天能补上嘛", tone: "ALMOST" },
];

interface ReminderOpt {
  id: string;
  title: string;
  groupName: string;
  late: string;
}

interface Props {
  reminderId: string;
  backHref: string;
  remaining: number;
  target: { id: string; displayName: string; slot: number };
  sender: { displayName: string; slot: number };
  lastSentAt: string | null;
  reminders: ReminderOpt[];
  groupName: string | null;
}

function timeAgoDays(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "刚拍过";
  if (days === 1) return "上次拍是 昨天";
  return `上次拍是 ${days} 天前`;
}

/**
 * Direct port of HfPoke body (design/project/hf-screens-B.jsx
 * lines 207-309). Inner JSX preserved byte-for-byte; only swaps:
 *   - <Phone> wrapper                  → page-level container
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - sample names / phrases / counts   → real props
 */
export function HfPoke({
  reminderId,
  backHref,
  remaining,
  target,
  sender,
  lastSentAt,
  reminders,
  groupName,
}: Props) {
  const [state, action, pending] = useActionState(sendPokeAction, initial);
  const [pickedReminderId, setPickedReminderId] = useState(reminderId);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrase = PHRASES[phraseIdx];
  const lastTxt = timeAgoDays(lastSentAt);

  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        maxWidth: "36rem",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "14px 14px 4px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href={backHref}
          className="hf-btn ghost"
          style={{ padding: "4px 8px", fontSize: 14 }}
          data-testid="poke-back"
        >
          ‹
        </Link>
        <div className="h-meta" style={{ marginLeft: "auto" }}>
          今日还能拍{" "}
          <b style={{ color: "var(--poke)" }} data-testid="poke-remaining">
            {remaining}
          </b>{" "}
          次
        </div>
      </div>

      <div style={{ padding: "4px 18px 0" }}>
        <div
          className="h-meta"
          style={{
            color: "var(--poke)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <HF.Icon name="wave" size={12} /> 想到 ta 了
        </div>
        <div className="h-display">拍拍{target.displayName}</div>
        <div className="h-body" style={{ marginTop: 2 }}>
          不是催促，只是说一声「我在」
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 14px 100px",
        }}
      >
        {/* big avatar w/ wave bubble (no shame) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
            marginTop: 4,
          }}
        >
          <div style={{ position: "relative" }}>
            <HF.Av name={target.displayName} i={target.slot} size={88} />
            <div
              className="hf-box thick tilt-r"
              style={{
                position: "absolute",
                right: -22,
                top: -8,
                padding: "4px 8px",
                background: "var(--paper)",
                fontFamily: "var(--hand-2)",
                fontSize: 13,
              }}
            >
              嗨～👋
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div className="h-h2">{target.displayName}</div>
          <div
            className="h-meta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "var(--ok)",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            在线{lastTxt && ` · ${lastTxt}`}
          </div>
        </div>

        {/* pick reminder */}
        <div
          className="h-meta"
          style={{ marginTop: 16, marginBottom: 4 }}
        >
          关于哪件事
        </div>
        <form
          action={(fd) => {
            fd.set("reminderId", pickedReminderId);
            fd.set("toUserId", target.id);
            fd.set("tone", phrase.tone);
            fd.set("message", phrase.t);
            return action(fd);
          }}
          data-testid="poke-form"
        >
          <div className="hf-box" style={{ padding: "4px 12px" }}>
            {reminders.map((r, i, a) => {
              const sel = pickedReminderId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPickedReminderId(r.id)}
                  data-testid={`poke-reminder-${r.id}`}
                  data-active={sel ? "true" : undefined}
                  className="hf-row w-full text-left"
                  style={{
                    borderBottom:
                      i === a.length - 1
                        ? "none"
                        : "1.3px dashed var(--ink-faint)",
                    background: sel ? "var(--poke-soft)" : "transparent",
                    margin: sel ? "0 -10px" : 0,
                    padding: sel ? "10px 10px" : undefined,
                    borderRadius: sel ? 8 : 0,
                  }}
                >
                  <span className={`hf-radio ${sel ? "on" : ""}`} />
                  <div style={{ flex: 1 }}>
                    <div className="h-row" style={{ fontSize: 16 }}>
                      {r.title}
                    </div>
                    <div className="h-meta">
                      #{r.groupName} · {r.late}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* phrase chips */}
          <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>
            说点啥
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PHRASES.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhraseIdx(i)}
                data-testid={`poke-phrase-${i}`}
                data-active={i === phraseIdx ? "true" : undefined}
                className={`hf-chip ${i === phraseIdx ? "fill" : ""}`}
                style={{ fontSize: 14 }}
              >
                {p.t}
              </button>
            ))}
            {/* voice chip is design-only for now; recording lands Phase 11 */}
            <span
              className="hf-chip"
              style={{ fontSize: 14, gap: 4, opacity: 0.55 }}
              aria-disabled="true"
              title="语音输入正在做"
            >
              <HF.Icon name="mic" size={12} /> 语音
            </span>
          </div>

          {/* preview */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            {target.displayName}会看到
          </div>
          <div
            className="hf-box"
            style={{
              padding: 10,
              marginTop: 4,
              display: "flex",
              gap: 10,
            }}
          >
            <HF.Av name={sender.displayName} i={sender.slot} size={28} />
            <div
              className="hf-box tilt-l"
              style={{
                flex: 1,
                padding: 10,
                background: "var(--poke-soft)",
                borderColor: "var(--poke)",
              }}
              data-testid="poke-preview"
            >
              <div
                className="h-meta"
                style={{
                  color: "var(--poke)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <HF.Icon name="wave" size={11} /> {sender.displayName} 拍了拍你
                {groupName && ` · ${groupName}`}
              </div>
              <div
                className="h-row"
                style={{
                  fontSize: 15,
                  marginTop: 4,
                  fontFamily: "var(--hand-2)",
                }}
              >
                「{phrase.t}」
              </div>
            </div>
          </div>

          <div
            className="h-meta"
            style={{
              marginTop: 12,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            ※ 拍拍 ≠ 催促 · ta 看到时不会有红色提醒
          </div>

          {state.message && !state.ok && (
            <div
              data-testid="poke-error"
              className="rt-nudge h-meta"
              style={{ marginTop: 8, color: "var(--poke)" }}
            >
              {state.message}
            </div>
          )}
          {state.ok && (
            <div
              data-testid="poke-ok"
              className="h-meta"
              style={{ marginTop: 8, color: "var(--ok)" }}
            >
              送到了 · 今日还能拍 {state.remaining} 次
            </div>
          )}

          {/* sticky bottom actions — keep absolute as design */}
          <div
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: "37.5rem",
              bottom: 0,
              background: "var(--paper)",
              borderTop: "1.3px dashed var(--ink-faint)",
              padding: "10px 14px",
              display: "flex",
              gap: 8,
            }}
          >
            <Link
              href={`/app/reminders/${reminderId}`}
              className="hf-btn ghost"
              style={{
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              data-testid="poke-help-instead"
            >
              <HF.Icon name="handshake" size={14} /> 我帮 ta 做
            </Link>
            <button
              type="submit"
              disabled={pending || remaining <= 0 || state.ok}
              className="hf-btn poke"
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 17,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              data-testid="poke-submit"
            >
              <HF.Icon name="wave" size={16} />{" "}
              {pending
                ? "送…"
                : remaining <= 0
                  ? "今日额满"
                  : "拍一下"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
