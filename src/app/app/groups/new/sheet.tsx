"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction, type CreateGroupState } from "../actions";

const initial: CreateGroupState = { ok: false };

const EMOJIS = ["📚", "🏃", "🍳", "🎨", "💪", "✏️", "🌱", "🎵"];

const TYPES: Array<{ key: string; t: string; s: string }> = [
  { key: "checkin", t: "一起打卡", s: "同一件事，每人各做" },
  { key: "shared", t: "共享清单", s: "一份事，谁有空谁做" },
  { key: "event", t: "只是约", s: "约一件大事" },
  { key: "vibe", t: "吐槽群", s: "没事拍拍互相提醒" },
];

/**
 * Direct port of HfL2NewGroup body (design lines 407-477). Markup
 * preserved byte-for-byte; we just lift cover-emoji + name + type +
 * rule-checkboxes into local state and submit via createGroupAction.
 */
export function CreateGroupSheet() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createGroupAction, initial);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [typeKey, setTypeKey] = useState("checkin");
  // Default rules — design shows three checkmarks (first two on, last off)
  const [rules, setRules] = useState({
    skipNotLose: true,
    hideStreakBreaks: true,
    weeklyRecap: false,
  });

  useEffect(() => {
    if (state.ok && state.groupId) {
      router.push(`/app/groups/${state.groupId}`);
    }
  }, [state.ok, state.groupId, router]);

  return (
    <form action={action} style={{ padding: "0 4px" }} data-testid="create-group-form">
      <input type="hidden" name="coverEmoji" value={emoji} />
      <input type="hidden" name="groupType" value={typeKey} />
      <div className="h-meta">新建小群</div>
      <div className="h-h2" style={{ marginTop: 2 }}>
        建一个一起打气的小窝
      </div>

      {/* cover picker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div
          className="hf-box thick"
          style={{
            width: 72,
            height: 72,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ok-soft)",
            fontSize: 38,
            transform: "rotate(-3deg)",
          }}
          data-testid="create-group-emoji-preview"
        >
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder="给小群取个名"
            data-testid="create-group-name"
            className="hf-box"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontFamily: "var(--hand)",
              fontSize: 17,
              border: "1.6px solid var(--line)",
              background: "var(--paper)",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {EMOJIS.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setEmoji(e)}
                data-testid={`create-group-emoji-${e}`}
                data-active={emoji === e ? "true" : undefined}
                className={`hf-chip ${emoji === e ? "fill" : ""}`}
                style={{ fontSize: 16, padding: "2px 6px" }}
              >
                {e}
              </button>
            ))}
          </div>
          {/* hidden classic emoji field for legacy tests */}
          <input
            type="hidden"
            data-testid="create-group-emoji"
            value={emoji}
            readOnly
          />
        </div>
      </div>

      {/* type */}
      <div className="h-meta" style={{ marginTop: 16 }}>
        这是个什么样的小群？
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginTop: 6,
        }}
      >
        {TYPES.map((opt) => {
          const sel = typeKey === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTypeKey(opt.key)}
              data-testid={`create-group-type-${opt.key}`}
              data-active={sel ? "true" : undefined}
              className="hf-box text-left"
              style={{
                padding: "8px 10px",
                background: sel ? "var(--ok-soft)" : "var(--paper)",
                borderColor: sel ? "var(--ok)" : "var(--line)",
                borderWidth: sel ? 2 : 1.6,
              }}
            >
              <div className="h-row" style={{ fontSize: 14 }}>
                {opt.t}
              </div>
              <div className="h-meta" style={{ fontSize: 11 }}>
                {opt.s}
              </div>
            </button>
          );
        })}
      </div>

      {/* friend ground rules */}
      <div className="h-meta" style={{ marginTop: 14 }}>
        群规（默认 — 可以改）
      </div>
      <div
        className="hf-box dashed"
        style={{
          marginTop: 6,
          padding: 10,
          background: "var(--paper-2)",
        }}
      >
        {(
          [
            { key: "skipNotLose", t: "跳过日不算输" },
            { key: "hideStreakBreaks", t: "不显示连续没做几天" },
            { key: "weeklyRecap", t: "每周一起复盘" },
          ] as const
        ).map((r, i, a) => {
          const on = rules[r.key];
          return (
            <button
              key={r.key}
              type="button"
              onClick={() =>
                setRules((prev) => ({ ...prev, [r.key]: !prev[r.key] }))
              }
              data-testid={`create-group-rule-${r.key}`}
              data-on={on ? "true" : "false"}
              className="hf-row w-full text-left"
              style={{
                padding: "4px 0",
                borderBottom:
                  i === a.length - 1
                    ? "none"
                    : "1.3px dashed var(--ink-faint)",
              }}
            >
              <span className={`hf-check ${on ? "done" : ""}`} />
              <div className="h-row" style={{ fontSize: 14 }}>
                {r.t}
              </div>
            </button>
          );
        })}
      </div>

      {state.fieldError && (
        <div
          data-testid="create-group-error"
          className="h-meta"
          style={{ marginTop: 8, color: "var(--poke)" }}
        >
          {state.fieldError}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => router.push("/app/groups")}
          className="hf-btn ghost"
          style={{ flex: 1, padding: "10px 0" }}
          data-testid="create-group-cancel"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="hf-btn primary"
          style={{ flex: 2, padding: "10px 0" }}
          data-testid="create-group-submit"
        >
          {pending ? "建群中…" : "下一步：拉朋友进来"}
        </button>
      </div>
    </form>
  );
}
