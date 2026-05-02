"use client";

import { useTransition } from "react";
import { addReactionAction } from "./actions";

const PRESETS = ["👍", "❤️", "🎉", "💪", "🌟"];

interface Props {
  reminderId: string;
  counts: Record<string, number>;
}

export function ReactionBar({ reminderId, counts }: Props) {
  const [pending, start] = useTransition();
  return (
    <div
      data-testid="reaction-bar"
      className="flex flex-wrap items-center gap-1.5"
    >
      {PRESETS.map((emoji) => {
        const c = counts[emoji] ?? 0;
        return (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", reminderId);
              fd.set("emoji", emoji);
              start(() => {
                void addReactionAction(fd);
              });
            }}
            data-testid={`reaction-${emoji}`}
            className="rt-box-tight bg-rt-paper px-2 py-1 text-sm transition-transform active:scale-95"
            style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
          >
            <span>{emoji}</span>
            {c > 0 && (
              <span className="ml-1 font-mono text-[10px] text-rt-ink-mute">
                {c}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
