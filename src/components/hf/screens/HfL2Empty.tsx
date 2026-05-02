"use client";

/**
 * 1:1 port of `window.HfL2Empty` body (design/project/hf-screens-L2.jsx
 * lines 1279-1325). The page header (date meta + "今天" display) is
 * already rendered by `<HfToday topSlot>` upstream, so this component
 * is just the inner sun-sticker + chips + friend-hint block plumbed in
 * via `<HfToday emptyFallback>`.
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                  → dropped (the page chrome owns it)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <window.HF.Av ...>               → <HF.Av ... />
 *   - hardcoded "tea" icon (not in     → "coffee" (closest visual)
 *     hf-icons.jsx)
 *   - hardcoded "阿May 今天读了 1 本书"  → real recent friend completion
 *
 * className + inline styles preserved byte-for-byte from the design.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { HF, type IconName } from "@/components/sketch/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import {
  createReminderAction,
  type CreateState,
} from "@/app/app/(home)/today-actions";

const initial: CreateState = { ok: false };

const CHIPS: Array<{ ic: IconName; t: string; key: string }> = [
  { ic: "coffee", t: "早餐", key: "coffee" },
  // "tea" was intended but not in hf-icons.jsx — coffee renders the
  // closest visual.
  { ic: "coffee", t: "喝水", key: "water" },
  { ic: "book", t: "读 10 分钟", key: "book" },
  { ic: "wave", t: "散个步", key: "wave" },
  { ic: "sparkle", t: "深呼吸 1 分钟", key: "sparkle" },
  { ic: "phone", t: "联系朋友", key: "phone" },
];

interface FriendHint {
  name: string;
  hintText: string;
}

export function HfL2Empty({ friendHint }: { friendHint: FriendHint | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const create = (label: string) => {
    if (pending) return;
    const fd = new FormData();
    fd.set("title", label);
    start(async () => {
      await createReminderAction(initial, fd);
      router.refresh();
    });
  };

  return (
    <div data-testid="today-empty" style={{ padding: "20px 22px 0", textAlign: "center" }}>
      <div
        className="hf-box thick tilt-l"
        style={{
          width: 100,
          height: 100,
          padding: 0,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ok-soft)",
        }}
      >
        <HF.Icon name="sun" size={56} color="var(--ok)" />
      </div>

      <div className="h-h2" style={{ marginTop: 18 }}>
        今天没什么事
      </div>
      <div
        className="h-body"
        style={{
          fontFamily: "var(--hand-2)",
          fontSize: 16,
          marginTop: 6,
          color: "var(--ink-mute)",
          lineHeight: 1.5,
        }}
      >
        也挺好的 — 休息一下。<br />
        想加点什么吗？
      </div>

      {/* quick add chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
          marginTop: 18,
        }}
      >
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => create(c.t)}
            disabled={pending}
            data-testid={`empty-chip-${c.key}`}
            className="hf-chip"
            style={{ fontSize: 13, padding: "4px 10px", gap: 5 }}
          >
            <HF.Icon name={c.ic} size={12} />
            {c.t}
          </button>
        ))}
      </div>

      <div className="h-meta" style={{ marginTop: 18, fontStyle: "italic" }}>
        或者点 + 自己写一个
      </div>

      {/* friend hint */}
      {friendHint && (
        <div
          className="hf-box dashed"
          style={{
            marginTop: 26,
            padding: 10,
            background: "var(--paper-2)",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HF.Av
              name={friendHint.name}
              size={28}
              i={avatarSlot(friendHint.name)}
            />
            <div
              style={{
                flex: 1,
                fontFamily: "var(--hand-2)",
                fontSize: 14,
              }}
            >
              {friendHint.name} {friendHint.hintText}
            </div>
            <span className="hf-chip" style={{ fontSize: 11 }}>
              给个赞
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
