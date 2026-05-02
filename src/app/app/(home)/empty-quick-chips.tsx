"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/sketch/icon";
import { createReminderAction, type CreateState } from "./today-actions";

const initial: CreateState = { ok: false };

const SUGGESTIONS: Array<{ ic: IconName; label: string }> = [
  { ic: "coffee", label: "早餐" },
  { ic: "bird", label: "喝水" },
  { ic: "book", label: "读 10 分钟" },
  { ic: "wave", label: "散个步" },
  { ic: "sparkle", label: "深呼吸 1 分钟" },
  { ic: "phone", label: "联系朋友" },
];

/**
 * The Today empty state's pre-filled quick chips. Tapping a chip creates
 * a private reminder titled with the chip's text and refreshes the
 * route so the day's list now has it.
 *
 * Mirrors HfL2Empty (design/project/hf-screens-L2.jsx lines 1294-1309).
 */
export function EmptyQuickChips() {
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
    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => create(s.label)}
          disabled={pending}
          data-testid={`empty-chip-${s.ic}`}
          className="rt-chip"
          style={{
            fontSize: 13,
            padding: "4px 10px",
            gap: 5,
          }}
        >
          <Icon name={s.ic} size={12} />
          {s.label}
        </button>
      ))}
    </div>
  );
}
