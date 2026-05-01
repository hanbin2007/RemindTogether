"use client";

import { useActionState, useState } from "react";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";
import { sendPokeAction, type PokeState } from "./actions";

const initial: PokeState = { ok: false };

const PHRASES: Array<{
  text: string;
  tone: "ALMOST" | "THINKING" | "NO_RUSH";
}> = [
  { text: "我也常忘 🫶", tone: "THINKING" },
  { text: "差一点点！", tone: "ALMOST" },
  { text: "想到你了～", tone: "THINKING" },
  { text: "一起搞定？", tone: "ALMOST" },
  { text: "不急，慢慢来", tone: "NO_RUSH" },
  { text: "今天能补上嘛", tone: "ALMOST" },
];

interface Props {
  reminderId: string;
  candidates: Array<{ id: string; displayName: string }>;
}

/**
 * Inline poke composer — friendly variant of HfPoke. Picks a target,
 * shows their avatar, lets the sender choose an encouraging phrase
 * (each phrase maps to a tone enum), and previews the bubble before
 * sending. NO red squiggle, no shame copy.
 */
export function PokeComposer({ reminderId, candidates }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendPokeAction, initial);
  const [target, setTarget] = useState(candidates[0]?.id ?? "");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrase = PHRASES[phraseIdx];

  if (candidates.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="poke-open"
        className="rt-btn rt-btn-poke"
      >
        <Icon name="wave" size={14} /> 拍拍 ta
      </button>
    );
  }

  const targetUser = candidates.find((c) => c.id === target) ?? candidates[0];

  return (
    <div
      data-testid="poke-composer"
      className="rt-poke-arrival rt-box p-3.5"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="rt-h-meta inline-flex items-center gap-1 rt-text-poke">
          <Icon name="wave" size={12} /> 想到 ta 了
        </span>
        <span className="rt-h-meta ml-auto">
          不是催促，只是说一声「我在」
        </span>
      </div>

      {/* target */}
      <label className="block mt-2">
        <span className="rt-h-meta">拍谁</span>
        <select
          name="toUserId"
          data-testid="poke-target"
          required
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rt-input mt-1 w-full"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
      </label>

      {/* big avatar */}
      <div className="flex justify-center mt-3 relative">
        <div className="relative">
          <Avatar
            name={targetUser.displayName}
            i={avatarSlot(targetUser.id)}
            size={72}
          />
          <span
            className="rt-box rt-box-thick rt-tilt-r absolute"
            style={{
              right: -20,
              top: -6,
              padding: "3px 7px",
              background: "var(--rt-paper)",
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
              fontSize: 12,
            }}
          >
            嗨～👋
          </span>
        </div>
      </div>
      <p className="rt-h-h2 text-center mt-2">{targetUser.displayName}</p>

      {/* phrase chips */}
      <p className="rt-h-meta mt-3 mb-1.5">说点啥</p>
      <form
        action={(fd) => {
          fd.set("reminderId", reminderId);
          fd.set("toUserId", target);
          fd.set("tone", phrase.tone);
          fd.set("message", phrase.text);
          return action(fd);
        }}
      >
        <div className="flex gap-1.5 flex-wrap">
          {PHRASES.map((p, i) => (
            <button
              key={i}
              type="button"
              data-testid={`poke-phrase-${i}`}
              data-active={i === phraseIdx ? "true" : undefined}
              onClick={() => setPhraseIdx(i)}
              className={`rt-chip ${i === phraseIdx ? "rt-chip-fill" : ""}`}
              style={{ fontSize: 14 }}
            >
              {p.text}
            </button>
          ))}
        </div>

        {/* preview bubble */}
        <p className="rt-h-meta mt-3">{targetUser.displayName} 会看到</p>
        <div className="rt-box p-2.5 mt-1 flex gap-2.5">
          <Avatar name="你" i={0} size={28} />
          <div
            className="rt-box rt-tilt-l flex-1 p-2.5"
            style={{
              background: "var(--rt-poke-soft)",
              borderColor: "var(--rt-poke)",
            }}
          >
            <p
              className="rt-h-meta inline-flex items-center gap-1"
              style={{ color: "var(--rt-poke)" }}
            >
              <Icon name="wave" size={11} /> 拍了拍你
            </p>
            <p
              className="rt-h-row"
              style={{
                fontSize: 15,
                marginTop: 4,
                fontFamily: "var(--font-kalam), Kalam, sans-serif",
              }}
            >
              「{phrase.text}」
            </p>
          </div>
        </div>

        <p
          className="rt-h-meta italic text-center mt-3"
          style={{ fontStyle: "italic" }}
        >
          ※ 拍拍 ≠ 催促 · ta 看到时不会有红色提醒
        </p>

        {state.message && !state.ok && (
          <p
            data-testid="poke-error"
            className="rt-nudge rt-h-meta mt-2"
            style={{ color: "var(--rt-poke)" }}
          >
            {state.message}
          </p>
        )}
        {state.ok && (
          <p
            data-testid="poke-ok"
            className="rt-h-body mt-2"
            style={{ color: "var(--rt-done)" }}
          >
            送到了 · 今日还能拍 {state.remaining} 次
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            disabled={pending}
            data-testid="poke-submit"
            className="rt-btn rt-btn-poke flex-1"
            style={{ fontSize: 16 }}
          >
            <Icon name="wave" size={16} /> 拍一下
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-testid="poke-cancel"
            className="rt-btn rt-btn-ghost"
          >
            收起
          </button>
        </div>
      </form>
    </div>
  );
}
